# Jetpack Beta Tester

This plugin can be used **alongside [the Jetpack plugin](https://wordpress.org/plugins/jetpack/)**, and will allow you run specific versions of Jetpack on your site:
- Bleeding Edge (`master`)
- Release Candidates (latest Beta releases)
- Feature branches ([branches currently being worked on in the Jetpack repository](https://github.com/Automattic/Jetpack/pulls))
- SVN Tags ([any existing tag in Jetpack's SVN repo](https://plugins.svn.wordpress.org/jetpack/tags/)): this allows you to install past versions of Jetpack on your site if necessary.

![Screenshot](./docs/images/screenshot.png "Jetpack Beta UI")

-------

## Quick Start

**Want to help us test out Jetpack?**

We'd love to have you! Just [download the latest version of this plugin](https://github.com/Automattic/jetpack-beta/releases) and install it alongside Jetpack, and we'll help keep you up to date with the very latest.

You can also join our Jetpack Beta mailing list at [jetpack.com/beta](https://jetpack.com/beta).

### Contribute

If you find issues with this plugin, you can [report bugs here on GitHub](https://github.com/Automattic/jetpack/issues/new?assignees=&labels=%5BType%5D+Bug&template=bug-report.yml).

-------

## Deployment

When you want to release a new version of the plugin, follow the steps below:

1. Run the monorepo release script: `tools/changelogger-release.sh plugins/beta`. Review the generated changelog.
2. Commit your changes.
3. Push the PR and have it reviewed and merged. Once the mirror repo is updated, a tag should have been automatically created.
4. Visit [this page](https://github.com/Automattic/jetpack-beta/releases), and click on the tag.
5. Download the zip file of your tag.
6. Locally, unzip that zip file, and rename the extracted folder to `jetpack-beta`.
7. Compress that folder back to `jetpack-beta.zip`.
8. Create a new release from the tag.
	- You'll want to fill in the release title with `Jetpack Beta xx`
	- Add the body of your changelog as release description.
	- Add the zip you created as a binary attached to the release. Be sure it is "jetpack-beta.zip"

-------

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

-------

## License

Jetpack is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt).
