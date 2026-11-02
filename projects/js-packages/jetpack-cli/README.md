# Jetpack CLI

This adds the `jp` command to the monorepo. It is a development tool that runs commands in a Docker container so you don't have to deal with mismatched node/pnpm/PHP versions.

In large part this is a wrapper for the older `jetpack` command, but runs its commands in a Docker container.

## Shell completion

`jp completion` prints a completion script for zsh or bash; save it once and source it from your shell's startup file, as described for the `jetpack` command in [tools/cli/README.md](https://github.com/Automattic/jetpack/blob/trunk/tools/cli/README.md#shell-completion). Completion runs the monorepo CLI on the host rather than in Docker, which needs pnpm installed on the host so that the container shares its dependency store.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Licensed under [GNU General Public License v2 (or later)](./LICENSE.txt).

