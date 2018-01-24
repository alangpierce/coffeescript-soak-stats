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
Error processing file manual_test/sharelatex/latex-hints-sharelatex/public/app/ide/controllers/LatexHintsController.coffee
2297/2297
Total files: 2296
Total lines: 453254
Total soak operations: 4447
Total soaked member accesses: 3674
Total soaked dynamic member accesses: 244
Total soaked function applications: 529
Total soaked new invocations: 0
Total soak operations using short-circuiting: 1394
Total soak operations using short-circuiting (excluding methods): 225
Total soaked assignments (including compound assignments): 36
Total soaked deletes: 1
Total cases where parens affected the soak container: 0
Total soak operations chained on top of another soak: 590
Total accesses of undeclared globals in soak operations: 74
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
Error processing file sharelatex/latex-hints-sharelatex/public/app/ide/controllers/LatexHintsController.coffee
```

This is an invalid CoffeeScript file.

-----

```
2297/2297
Total files: 2296
Total lines: 453254
Total soak operations: 4447
```

"Total soak operations" includes all uses of soak synax:
`a?.b`, `a?[b]`, `a?()`, `new A?()`, and `a?[b..c]`.

-----

```
Total soaked member accesses: 3674
```

A soaked member access is an expression like `a?.b`.

-----

```
Total soaked dynamic member accesses: 244
```

A soaked dynamic member access is an expression like `a?[b]`.

-----

```
Total soaked function applications: 529
```

A soaked function application is an expression like `a?()`.

-----

```
Total soaked new invocations: 0
```

A soaked new invocation is an expression like `new A?()`.

-----

```
Total soak operations using short-circuiting: 1394
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
Total soak operations using short-circuiting (excluding methods): 225
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
Total soaked assignments (including compound assignments): 36
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
Total soak operations chained on top of another soak: 590
```

This counts cases like `a?.b?.c?.d`, where the code explicitly uses multiple
soak operations in a chain. The actual number is the number of soak operations
in a non-initial position in a chain, so `a?.b?.c?.d` adds 2 to this stat,
`a?.b.c?.d` adds 1 to this stat, and `a?.b.c.d` adds 0 to this stat.

This is meant to help understand how common it is to explicitly use multiple
soak opertions in a row vs. relying on short circuiting.
-----

```
Total accesses of undeclared globals in soak operations: 74
```

This counts cases like `window?.a`, where `window` is never declared in this
scope (or a parent scope). In other words, these instances rely on the behavior
that `a?.b` evaluates to `undefined` rather than crashing when `a` is an
undeclared variable and isn't in the global scope.