# Jetpack Yarn→Pnpm update, June 2021

Due to the [end of support for Yarn 1] and several bugs that were impacting our workflows, we realized a need to update the package manager.
After discussion and analysis (p9dueE-2MY-p2) we decided to go with pnpm as the replacement.

## Why pnpm?

Several reasons:

* More sensible structure to `node_modules/` than the hoisting done by npm and yarn.
  * More strict about undeclared dependencies without having to complately switch to something like Plug'n'Play.
* Mature workspace features.
* Better performance in typical configurations with our repo.
* Lack of desire to be a testbed for new proposals like Plug'n'Play or Zero Installs.

## Upgrade caveats

### Installation

You'll likely have to install pnpm, of course. Instructions may be found at https://pnpm.io/installation.

### Pre-upgrade cleanup

Before checking out a branch using pnpm, you'll likely want to remove any `node_modules/` directories. You can do this with a command like
```bash
rm -rf node_modules projects/*/*/node_modules projects/plugins/jetpack/tests/e2e/node_modules tools/cli/node_modules
```
You may also want to uninstall the Jetpack CLI from yarn with `yarn cli-unlink`.
Then, after checking out the branch, execute `pnpm install`.

If you forget to do this, you'll most like get the following message when checking out the branch:
```
warning Jetpack_Monorepo@: The engine "pnpm" appears to be invalid.
error Jetpack_Monorepo@: The engine "yarn" is incompatible with this module. Expected version "use pnpm instead - see docs/yarn-upgrade.md". Got "1.22.10"
error Commands cannot run with an incompatible environment.
```
That's ok, nothing is broken. Just do the above steps.

If you move back to a branch that's still using yarn (and want to do actual work on it), you may want to remove `node_modules/` again so as to not confuse yarn with
pnpm's structure.

### Command changes

Most of the built-in commands are the same, although arguments accepted may differ. Also note that simply `yarn` with no command was equivalent to `yarn install`,
while with `pnpm` you need to explicitly specify the `install` command.

Scripts formerly run using `yarn foobar` may now be run using `pnpm foobar`.

Note that many commands are available via the Jetpack CLI, which should be used when available in preference to using pnpm (or yarn) to run scripts.
This includes all the docker commands: instead of `yarn docker:up` or `pnpm docker:up`, you can do `jetpack docker up` and be ready for any future changes.

### Dependency issues

Most of the time, the solution is to add the missing dependency to the appropriate package.json.

Pnpm is more strict about undeclared dependencies. For example, the package `eslint` depends on `debug`. With yarn 1, if you had `eslint` listed in
your package.json then it would "hoist" that `debug` dependency which would have the side effect that you could `require( 'debug' )` in your JS code
and use the package without ever having declared the direct dependency. Pnpm organizes things differently so `eslint` can find its dependency on `debug`
while your own code will not see it unless you declare that dependency yourself.

If transpiling with `@babel/plugin-transform-runtime` and using other JS modules from the monorepo, note that you'll want to set the `absoluteRuntime` option
to `@babel/plugin-transform-runtime` so it can find `@babel/runtime` (and you'll need to include that as a dependency in your package.json). This also applies
when using calypso-build; currently a hack is needed (see [projects/plugins/jetpack/babel.config.js]) to get that set as calypso-build doesn't yet support the
option directly.


[end of support for Yarn 1]: https://github.com/yarnpkg/yarn/compare/977943e%5E...14bcd15#diff-185833cb26d7ac66a4d39042fd576a820c2c2c6d05ad18973bb9c7dce77267c5R29-R32
[projects/plugins/jetpack/babel.config.js]: ../projects/plugins/jetpack/babel.config.js
