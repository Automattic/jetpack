# Jetpack Monorepo

[![License](https://poser.pugx.org/automattic/jetpack/license.svg)](https://www.gnu.org/licenses/gpl-2.0.html)
[![Code Climate](https://codeclimate.com/github/Automattic/jetpack/badges/gpa.svg)](https://codeclimate.com/github/Automattic/jetpack)

This is the Jetpack Monorepo. It contains source code for the Jetpack plugin, the Jetpack composer packages, and other things.

## How to install Jetpack plugin on your site

**If you are not planning on developing with Jetpack, you should install Jetpack from pre-built sources.** Details on that may be found [on this page](https://github.com/Automattic/jetpack-production#jetpack).

### Installation From Git Monorepo

To run the Jetpack plugin from the monorepo, you'll first need to build the JS and CSS. To do so, [follow the instructions here](./docs/development-environment.md).

If you're using the [Docker development environment](./docs/development-environment.md#docker-supported-recommended), you should then be all set.

If not, you'll need to create a link to the Jetpack plugin from your WordPress `wp-content/plugins` folder. You'll need to know the filesystem path to the monorepo checkout and to your WordPress installation. Then, on Linux or Mac OS X, open a terminal and use `ln -s` to create the link, something like
```
ln -s /path/to/jetpack-monorepo/projects/plugins/jetpack /path/to/wordpress/wp-content/plugins/jetpack
```
On Windows (Vista and later), open an Administrator Command Prompt window and use `mklink /D` similarly.

## Contribute

Thank you for thinking about contributing to Jetpack! If you're unsure of anything, feel free to submit an issue or pull request on any topic. The worst that can happen is that you'll be politely directed to the best location to ask your question or to change something in your pull request. There are a variety of options for how you can help:

- [Write and submit patches](./docs/CONTRIBUTING.md#write-and-submit-a-patch).
- If you found a bug, [file a report here](https://github.com/Automattic/jetpack/issues/new). You can [check our recommendations to create great bug reports here](./docs/guides/report-bugs.md).
- [Join our Jetpack Beta program](./docs/testing/beta-testing.md) and help us test new releases.
- [Translate Jetpack in your language](./docs/translations.md).

To clarify these expectations, Jetpack has adopted the code of conduct defined by the Contributor Covenant. It can be read in full [here](CODE-OF-CONDUCT.md).

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt).

<!-- end sync section -->
## Team

Jetpack is developed and maintained by various teams at Automattic. The Jetpack Crew responsible for coordinating everything is comprised of @anomiex, @bisko, @brbrr, @dereksmart, @fgiannar, @jeherve, @kbrown9, @kraftbj, @leogermani, @mdbitz, @sergeymitr and @zinigor.

Contributions have been and continue to be made by dozens of other Automatticians, like:

@aldavigdis, @allendav, @apeatling, @azaozz, @bazza, @beaulebens, @briancolinger, @cfinke, @daniloercoli, @chaosexanima, @ebinnion, @enejb, @eoigal, @georgestephanis, @gibrown, @gititon, @gravityrail, @jasmussen, @jblz, @jeffgolenski, @jeherve, @jessefriedman, @joanrho, @justinshreve, @keoshi, @koke, @kovshenin, @kraftbj, @lancewillett, @lezama, @martinremy, @mdawaffe, @MichaelArestad, @mtias, @mcsf, @mdawaffe, @nickmomrik, @obenland, @oskosk, @pento, @roccotripaldi, @stephdau, @Viper007Bond, @xyu and @yoavf.

Our _awesome_ happiness engineers are @a8ck3n, @aheckler, @almoyen, @annezazuu, @bikedorkjon, @cena, @chaselivingston, @chickenn00dle, @coder-karen, @codestor4, @csonnek, @danjjohnson, @dericleeyy, @gaurav1984, @gsmumbo, @htdat, @jenhooks, @jeremypaavola, @joeboydston, @joendotcom, @lizthefair, @macmanx2, @madhattermattic, @mbhthompson, @mzakariya, @NujabesSoul, @ntpixels, @pmciano, @rachelsquirrel, @rcowles, @richardmtl, @snowmads, @stefmattana, and @tmmbecker.

Interested in working on awesome open-source code all day? [Join us](https://automattic.com/work-with-us/)!
