# Jetpack Backup

Easily restore or download a backup of your site from a specific moment in time.

## How to install Jetpack Backup

### Installation From Git Repo

The easiest way to get the latest version by using the [Jetpack Beta plugin](https://jetpack.com/beta/).

Alternatively, the next is by grabbing the zip from the build plugin repo.

1. Download https://github.com/Automattic/jetpack-backup-plugin/archive/refs/heads/trunk.zip
2. Install via the wp-admin Add Plugin via upload method.

Lastly, if you have made changes to the plugin, you can either use the Jetpack Docker setup or the following to build from source:

1. Check out and set up the Jetpack repo, including the CLI.
2. `jetpack build plugins/backup --production` <-- this builds without fancy symlinks, so that the build can run standalone

Now you can zip up the `projects/plugins/backup` directory and upload to your WordPress site.

## Contribute

## Get Help

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Backup is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

