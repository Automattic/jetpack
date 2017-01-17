# Jetpack

[![License](https://poser.pugx.org/automattic/jetpack/license.svg)](http://www.gnu.org/licenses/gpl-2.0.html)
[![Code Climate](https://codeclimate.com/github/Automattic/jetpack/badges/gpa.svg)](https://codeclimate.com/github/Automattic/jetpack)

[Jetpack](http://jetpack.com/) is a WordPress plugin that supercharges your self-hosted WordPress site with the awesome cloud power of WordPress.com.

For more information, check out [jetpack.com](http://jetpack.com/).

## Get Started

To install the Jetpack plugin on your site, [follow the instructions on this page](http://jetpack.com/install/).

## Get Help

Do you need help installing Jetpack, or do you have questions about one of the Jetpack modules? You can [search through our documentation here](http://jetpack.com/support/). If you don't find the answers you're looking for, you can [send us an email](http://jetpack.com/contact-support/) or [start a new thread in the WordPress.org support forums](https://wordpress.org/support/plugin/jetpack#postform).

## Installation from  git repo

The `master-stable` branch of this repo contains an stable version with every JS and CSS file pre-built.

CD into your Plugins directory

```
$ git clone git@github.com:Automattic/jetpack.git
$ cd jetpack
$ git checkout master-stable
```

## Contribute

Developers of all levels can help — whether you can barely recognize a filter (or don’t know what that means) or you’ve already authored your own plugins, there are ways for you to pitch in. Blast off:

- [Join our Jetpack Beta program](http://jetpack.com/beta/).
- If you found a bug, [file a report here](https://github.com/Automattic/jetpack/issues/new). You can [check our recommendations to create great bug reports here](http://jetpack.com/contribute/#bugs).
- [Translate Jetpack in your language](https://translate.wordpress.org/projects/wp-plugins/jetpack).
- [Write and submit patches](https://github.com/Automattic/jetpack/blob/master/.github/CONTRIBUTING.md#write-and-submit-a-patch).

### Development workflow

The javascript and CSS components of this plugin's admin interface need to be built in order to get the runtime bundle (`_inc/build/admin.js`)

**Recommended Environment**

* Node 6.x
* npm 3.8.x
* yarn 0.16.1

#### A note on Node versions used for the build tasks

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

#### Development build

The development build will create a build without minifying or deduping code. It will also install dependencies for you, so you don't need to `npm install` before it.

```
$ yarn build
```

#### Development build with changes monitoring (watch)

You can ran a watch process which will continuously watch the front-end JS and CSS/Sass for changes and rebuild accordingly.
Instead of `yarn build` you'd use `yarn watch`.

Before running the watch process you may need to `npm install` the npm dependencies first if you didn't do it already.

```
$ yarn
$ yarn watch
```

#### Production build

The production build will generate minified files without duplicated code (resulting from dependencies) and also will generate the matching sourcemap files and language files.

```
$ yarn build-production
```

#### Unit-testing the JS Admin Page

You can run [Mocha](https://mochajs.org/) based tests for the Admin Page source code.

Standing on your jetpack directory, run

```
$ yarn
$ yarn test-client
```

## Monitor our activity on this repository

[![Throughput Graph](https://graphs.waffle.io/automattic/jetpack/throughput.svg)](https://waffle.io/automattic/jetpack/metrics)

## Team

The Jetpack Pit Crew is comprised of @dereksmart, @samhotchkiss, @zinigor, @eliorivero, and @rcoll.

Contributions have been and continue to be made by dozens of other Automatticians, like:

@georgestephanis, @jeffgolenski, @jessefriedman, @richardmuscat, @justinkropp, @aliso, @allendav, @alternatekev, @apeatling, @azaozz, @bazza, @beaulebens, @cfinke, @daniloercoli, @enejb, @eoigal, @ethitter, @gibrown, @hugobaeta, @jasmussen, @jblz, @jkudish, @johnjamesjacoby, @justinshreve, @koke, @kovshenin, @lancewillett, @lezama, @martinremy, @MichaelArestad, @mtias, @mcsf, @mdawaffe, @nickmomrik, @obenland, @oskosk, @pento, @rase-, @roccotripaldi, @skeltoac, @stephdau, @tmoorewp, @Viper007Bond, @xyu and @yoavf.

Our _awesome_ happiness engineers are @jeherve, @richardmtl, @csonnek, @rcowles, @kraftbj, @chaselivingston, @jenhooks, @aheckler, @ntpixels, @macmanx2, @lschuyler, @seejacobscott, @davoraltman, @lamdayap, @rachelsquirrel, @scarstocea, @stefmattana, @jamilabreu, @cena, @v18, @bikedorkjon, @drpottex, @gregwp, @annezazuu, @danjjohnson, and @mbhthompson.

Interested in working on awesome open-source code all day? [Join us](http://automattic.com/work-with-us/)!
