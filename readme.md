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

**Recommended Dependencies and Known Issues**

Recommended environment:
- Node 5.x (preferably 5.11 or 5.10)
- npm 3.8.x

If you're having trouble installing 5.x, [nvm](https://www.npmjs.com/package/nvm) is a nice tool for node version management :)

Known Issues:
- Does not work with Node 6.x nor 4.x.

**Start Development**

1. Make sure you have `git`, `node`, and `npm` installed and a working WordPress installation.
2. Clone this repository locally inside your `/wp-content/plugins` directory.

	```
	git clone https://github.com/Automattic/jetpack.git
	```

3. Make sure the Jetpack plugin is active and run

	```
	npm run build
	```

	This will install npm dependencies and then build the files.

4. Open `/wp-admin/admin.php?page=jetpack` in your browser.

#### Development build

Running `npm run watch` instead of `npm run build` will build all the code and continuously watch the front-end JS and CSS/Sass for changes and rebuild accordingly. Before running `npm run watch` you may need to `npm install` the npm dependencies first.

Clone this repository inside your Plugins directory.

```
$ git clone git@github.com:Automattic/jetpack.git
$ cd jetpack
$ npm install
$ npm run watch
```

#### Unit-testing the JS Admin Page

You can run [Mocha](https://mochajs.org/) based tests for the Admin Page source code with `npm run test-client`

Standing on your jetpack directory, run

```
$ npm install
$ npm run test-client
```

## Monitor our activity on this repository

[![Throughput Graph](https://graphs.waffle.io/automattic/jetpack/throughput.svg)](https://waffle.io/automattic/jetpack/metrics)

## Team

The Jetpack Pit Crew is comprised of @dereksmart, @samhotchkiss, @zinigor, @eliorivero, and @rcoll.

Contributions have been and continue to be made by dozens of other Automatticians, like:

@georgestephanis, @jeffgolenski, @jessefriedman, @richardmuscat, @justinkropp, @aliso, @allendav, @alternatekev, @apeatling, @azaozz, @bazza, @beaulebens, @cfinke, @daniloercoli, @enejb, @eoigal, @ethitter, @gibrown, @hugobaeta, @jasmussen, @jblz, @jkudish, @johnjamesjacoby, @justinshreve, @koke, @kovshenin, @lancewillett, @lezama, @martinremy, @MichaelArestad, @mtias, @mcsf, @mdawaffe, @nickmomrik, @obenland, @pento, @rase-, @roccotripaldi, @skeltoac, @stephdau, @tmoorewp, @Viper007Bond, @xyu and @yoavf.

Our _awesome_ happiness engineers are @jeherve, @richardmtl, @csonnek, @rcowles, @kraftbj, @chaselivingston, @jenhooks, @aheckler, @ntpixels, @macmanx2, @lschuyler, @seejacobscott, @davoraltman, @lamdayap, @rachelsquirrel, @scarstocea, @stefmattana, @jamilabreu, @cena, @v18, @bikedorkjon, @drpottex, @gregwp, @annezazuu, and @danjjohnson.

Interested in working on awesome open-source code all day? [Join us](http://automattic.com/work-with-us/)!
