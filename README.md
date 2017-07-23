# coffeescript-soak-stats

A command-line tool that you can run on a CoffeeScript codebase to get
statistics on different types of soak operations (`?.` syntax).

Built to help inform the discussion around the
[JavaScript Optional Chaining proposal](https://github.com/tc39/proposal-optional-chaining).

## Usage

```
> npm install -g coffeescript-soak-stats
> git clone https://github.com/atom/atom.git
> coffeescript-soak-stats atom
Error processing file atom/spec/fixtures/sample-with-tabs-and-leading-comment.coffee
153/153
Total files: 152
Total lines: 37411
Total soak operations: 364
Total soaked member accesses: 283
Total soaked dynamic member accesses: 17
Total soaked function applications: 64
Total soaked new invocations: 0
Total soak operations using short-circuiting: 159
Total soak operations using short-circuiting (excluding methods): 17
Total soaked assignments (including compound assignments): 3
Total soaked deletes: 0
Total cases where parens affected the soak container: 0
```
