# coffeescript-soak-stats

A command-line tool that you can run on a CoffeeScript codebase to get
statistics on different types of soak operations (`?.` syntax).

Built to help inform the discussion around the
[JavaScript Optional Chaining proposal](https://github.com/tc39/proposal-optional-chaining).

## Usage

```
npm install -g coffeescript-soak-stats
coffeescript-soak-stats my-project
```
## Stats when running on many projects at once

The `manual_test/clone_all_repos.py` script clones about 500,000 lines of
CoffeeScript from various projects on GitHub. Note that I intentionally excluded
the CoffeeScript compiler source code because its test suite isn't
representative of real-world code.

Here's what it prints when running stats on all of them:

```
Error processing file atom/atom/spec/fixtures/sample-with-tabs-and-leading-comment.coffee
Error processing file repos/sharelatex/latex-hints-sharelatex/public/app/ide/controllers/LatexHintsController.coffee
2491/2491
Total files: 2489
Total lines: 475208
Total soak operations: 4627
Total soaked member accesses: 3811
Total soaked dynamic member accesses: 240
Total soaked function applications: 576
Total soaked new invocations: 0
Total soak operations using short-circuiting: 1522
Total soak operations using short-circuiting (excluding methods): 233
Total soaked assignments (including compound assignments): 37
Total soaked deletes: 1
Total cases where parens affected the soak container: 0
Total soak operations chained on top of another soak: 564
```

### Definitions

**Soak operation** refers to the class of `?` operations here. It's the
CoffeeScript term for optional chaining. It does *not* include the binary `?`
operator or `?=` compound assignment operator.

The **soak container** of a soak operation is a term I use to refer to the
expression whose evaluation will be skipped if the soaked value is null or
undefined. For example, in the expression `a(b?.c.d)`, the soak container is
`b?.c.d`.

### Explanation of each stat

```
Error processing file atom/atom/spec/fixtures/sample-with-tabs-and-leading-comment.coffee
Error processing file sharelatex/latex-hints-sharelatex/public/app/ide/controllers/LatexHintsController.coffee
```

These two files are both invalid CoffeeScript files. The first is a test fixture
that's presumably meant to test invalid files, not sure about the second.

-----

```
2491/2491
Total files: 2489
Total lines: 475208
Total soak operations: 4627
```

"Total soak operations" includes all uses of soak synax:
`a?.b`, `a?[b]`, `a?()`, `new A?()`, and `a?[b..c]`.

-----

```
Total soaked member accesses: 3811
```

A soaked member access is an expression like `a?.b`.

-----

```
Total soaked dynamic member accesses: 240
```

A soaked dynamic member access is an expression like `a?[b]`.

-----

```
Total soaked function applications: 576
```

A soaked function application is an expression like `a?()`.

-----

```
Total soaked new invocations: 0
```

A soaked new invocation is an expression like `new A?()`.

-----

```
Total soak operations using short-circuiting: 1522
```

A soak expression counts toward this stat if the expression evaluating to null
would cause "short-circuit" effects; that is, if there's anything else in the
soak container that would be skipped.

Examples:
* `a?.b.c`
* `a?.b()`

Non-examples:
* `a(b?.c)`

-----

```
Total soak operations using short-circuiting (excluding methods): 233
```

This is the same as the previous statistic, except that it excludes expressions
of the form `a?.b()`. In other words, the vast majority of short circuiting in
practice is only used for method call syntax and doesn't extend beyond that, and
this stat counts the number of cases that *do* extend beyond that.

Examples:
* `a?.b.c`
* `a?.b().c`

Non-examples:
* `a?.b()`
* `a?.b(c, d, e)`

-----

```
Total soaked assignments (including compound assignments): 37
```

A soaked assignment is an expression like `a?.b = c`. A soaked compound
assignment is an expression like `a?.b += c`.

This does **not** include cases like `a = b?.c`. It's only cases where the
assignment would be skipped if the soaked expression evaluates to `null` or
`undefined`.

-----

```
Total soaked deletes: 1
```

A soaked delete is an expression like `delete a?.b`.

-----

```
Total cases where parens affected the soak container: 0
```

This counts cases where the existence of parentheses affected the evaluation of
a soak operation. For example, `(a?.b).c` crashes if `a` is null or undefined,
even though `a?.b.c` does not crash in that case.

-----

```
Total soak operations chained on top of another soak: 564
```

This counts cases like `a?.b?.c?.d`, where the code explicitly uses multiple
soak operations in a chain. The actual number is the number of soak operations
in a non-initial position in a chain, so `a?.b?.c?.d` adds 2 to this stat,
`a?.b.c?.d` adds 1 to this stat, and `a?.b.c.d` adds 0 to this stat.

This is meant to help understand how common it is to explicitly use multiple
soak opertions in a row vs. relying on short circuiting.
