# Development Environment

The javascript and CSS components of this plugin's admin interface need to be built in order to get the runtime bundle (`_inc/build/admin.js`)

**Recommended Environment**

* Node 6.x
* npm 3.8.x
* yarn 0.17.9

## A note on Node versions used for the build tasks

We try to frequently keep the Node version we use up to date. So, eventually you may need to refresh your package dependencies (i.e., the `node_modules` directories). This is because some dependencies are built specifically for the Node version you used when you installed them (either by running `yarn build` or `yarn`).

We recommend usage of [nvm](https://www.npmjs.com/package/nvm) for managing different Node versions on the same environment.

**Note:** If you have previously run the Jetpack build tasks (e.g. `yarn build`), and didn't come back to it for a long time, you can
run this command before building again. Otherwise you may experience errors on the command line while trying to build.

```
$ yarn distclean
```

**Start Development**

1. Make sure you have `git`, `node`, and `npm` installed and a working WordPress installation.
2. Clone this repository inside your Plugins directory.

	```
	$ git clone https://github.com/Automattic/jetpack.git
	$ cd jetpack
	```

3. Install [yarn](https://www.npmjs.com/package/yarn) package.
    ```
    npm install -g yarn@0.17.9
    ```

4. Make sure the Jetpack plugin is active and run

	```
	$ yarn build
	```

	This will install npm dependencies and then build the files.

5. Open `/wp-admin/admin.php?page=jetpack` in your browser.

## Development build

The development build will create a build without minifying or deduping code. It will also install dependencies for you, so you don't need to `npm install` before it.

```
$ yarn build
```

## Development build with changes monitoring (watch)

You can ran a watch process which will continuously watch the front-end JS and CSS/Sass for changes and rebuild accordingly.
Instead of `yarn build` you'd use `yarn watch`.

Before running the watch process you may need to `npm install` the npm dependencies first if you didn't do it already.

```
$ yarn
$ yarn watch
```

## Production build

The production build will generate minified files without duplicated code (resulting from dependencies) and also will generate the matching sourcemap files and language files.

```
$ yarn build-production
```

## Unit-testing

Jetpack includes several [unit tests](https://github.com/Automattic/jetpack/tree/master/tests) that you can run in your local environment before to submit a new Pull Request.

To get started, you can follow the instructions [here](https://phpunit.de/getting-started.html) to install PHPUnit on your machine. Once you've done so, you can get the WordPress testing codebase like so:

`svn checkout http://unit-tests.svn.wordpress.org/trunk wordpress-tests`

To run tests on your machine, you can run `phpunit` while in the Jetpack directory.

If you need more information, you can follow [this guide](https://jetpack.com/2013/08/20/unit-tests/).

If you're not familiar with PHP Unit Testing, you can also check [this tutorial](https://pippinsplugins.com/series/unit-tests-wordpress-plugins/)

## Unit-testing the JS Admin Page

You can run [Mocha](https://mochajs.org/) based tests for the Admin Page source code.

Standing on your jetpack directory, run

```
$ yarn
$ yarn test-client
```

## Use PHP CodeSniffer and ESLint to make sure your code respects coding standards

We strongly recommend that you install tools to review your code in your IDE. It will make it easier for you to notice any missing documentation or coding standards you should respect. Most IDEs display warnings and notices inside the editor, making it even easier.

- You can find [Code Sniffer rules for WordPress Coding Standards](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#installation) here. Once you've installed these rulesets, you can [follow the instructions here](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#how-to-use) to configure your IDE.
- For JavaScript, we recommend installing ESLint. Most IDEs come with an ESLint plugin that you can use. Jetpack includes a `.eslintrc` file that defines our coding standards.
