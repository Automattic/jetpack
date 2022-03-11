# Jetpack Monorepo rsync

Script to rsync plugins from the Jetpack Monorepo to any source. 

Useful if you want to develop against a live site. 

It's only special because of the custom include/exclude paths (Jetpack has a lot), and the symlinks created in the Jetpack development environment. 

## Requirements
_Disclaimer: Only tested on MacOSX._ 

[Install `fswatch`](https://github.com/emcrisostomo/fswatch#getting-fswatch) if you want to use the watch (`-w`) command.

## Running the script
### Set the paths in rsync-plugins.sh
```shell
# Point to your local Jetpack checkout.
JETPACK_REPO_PATH="/path/to/jetpack/repo"

# Point to the source /plugins directory.
DEST_PLUGINS_PATH="user@host.name.com:/path/to/plugins"
```
### Commands:

`-p <plugin_slug>` : Target a specific plugin in projects/plugins. Defaults to `jetpack`.

`-w` : Watch the directory and auto-push changes when made (requires [fswatch](https://github.com/emcrisostomo/fswatch#getting-fswatch)). Works best if using keypair auth.

### Examples
```shell
# Push the jetpack plugin to source one time.
./rsync-plugins.sh 

# Push the backup plugin one time.
./rsync-plugins.sh -p backup

# Watch for changes in the boost plugin, and push if found.
./rsync-plugins.sh -w -p boost
```