import SourceToken from 'coffee-lex/dist/SourceToken';
import SourceTokenList from 'coffee-lex/dist/SourceTokenList';
import SourceType from 'coffee-lex/dist/SourceType';
import {
  BaseAssignOp, DeleteOp,
  DynamicMemberAccessOp, FunctionApplication, MemberAccessOp, Node,
  PostDecrementOp,
  PostIncrementOp, PreDecrementOp, PreIncrementOp, SoakedDynamicMemberAccessOp,
  SoakedFunctionApplication,
  SoakedMemberAccessOp, SoakedNewOp, SoakedProtoMemberAccessOp, SoakedSlice
} from 'decaffeinate-parser/dist/nodes';

export function isSoakOperation(node: Node): boolean {
  return node instanceof SoakedMemberAccessOp ||
    node instanceof SoakedDynamicMemberAccessOp ||
    node instanceof SoakedFunctionApplication ||
    node instanceof SoakedProtoMemberAccessOp ||
    node instanceof SoakedNewOp ||
    node instanceof SoakedSlice;
}

export function findSoakContainer(node: Node, tokens: SourceTokenList): Node {
  let result = node;
  while (canParentHandleSoak(result, tokens)) {
    if (!result.parentNode) {
      throw new Error('Expected parent node.');
    }
    result = result.parentNode;
  }
  return result;
}

function canParentHandleSoak(node: Node, tokens: SourceTokenList): boolean {
  if (node.parentNode === null) {
    return false;
  }
  if (isSurroundedByParens(node, tokens)) {
    return false;
  }
  if (node.parentNode instanceof MemberAccessOp) {
    return true;
  }
  if (node.parentNode instanceof DynamicMemberAccessOp &&
      node.parentNode.expression === node) {
    return true;
  }
  if (node.parentNode instanceof FunctionApplication &&
      node.parentNode.function === node) {
    return true;
  }
  if (node.parentNode instanceof BaseAssignOp &&
      node.parentNode.assignee === node) {
    return true;
  }
  if (node.parentNode instanceof PostIncrementOp ||
      node.parentNode instanceof PostDecrementOp ||
      node.parentNode instanceof PreIncrementOp ||
      node.parentNode instanceof PreDecrementOp ||
      node.parentNode instanceof DeleteOp) {
    return true;
  }
  return false;
}

function isSurroundedByParens(node: Node, tokens: SourceTokenList): boolean {
  const prevTokenIndex = tokens.indexOfTokenNearSourceIndex(node.start - 1);
  const nextTokenIndex = tokens.indexOfTokenNearSourceIndex(node.end - 1).next();
  const prevSemanticTokenIndex =
    tokens.lastIndexOfTokenMatchingPredicate(isSemanticToken, prevTokenIndex);
  const nextSemanticTokenIndex =
    tokens.indexOfTokenMatchingPredicate(isSemanticToken, nextTokenIndex);
  if (!prevSemanticTokenIndex || !nextSemanticTokenIndex) {
    return false;
  }
  const prevToken = tokens.tokenAtIndex(prevSemanticTokenIndex);
  const nextToken = tokens.tokenAtIndex(nextSemanticTokenIndex);
  if (!prevToken || !nextToken) {
    return false;
  }
  return prevToken.type === SourceType.LPAREN && nextToken.type === SourceType.RPAREN;
}

function isSemanticToken(token: SourceToken): boolean {
  return ![
    SourceType.COMMENT, SourceType.HERECOMMENT, SourceType.NEWLINE
  ].includes(token.type);
}
