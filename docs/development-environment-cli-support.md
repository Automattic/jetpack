# Support page for the Development Environment Command line checker

### Usage

```sh
tools/check-development-environment.sh
```

## Topics

### Command is available: jetpack

The Jetpack CLI is used for management of monorepo projects.

Install via
```sh
yarn install
```

In some instances, this will not work depending on permissions, etc. You may need to add `~/.yarn/bin` to your system's PATH. 
If `jetpack` is still not available, you can run `yarn jetpack` from the repo root only.

`jetpack`, when installed, will work from anywhere within the repo.

### Bash version is proper

Several scripts require bash 4 or later. If you're on Mac OS X, you likely have an old version and can install an upgraded version with `brew install bash`.

### Command is available: docker

The command `docker` comes with the Docker app in most environments.

This command is essential for running the Jetpack Docker Development Environment.

### Command is available: docker-compose

The command `docker-compose` comes with the Docker app in most environments nowadays but it was not the case with old versions of the Docker app.

This command is needed for leveraging the multiple docker containers that encompass the Jetpack Docker Development Environment.

### Command is available: git

You need GIT for contributing to Jetpack.

### Command is available: jq

Several scripts use `jq` for processing JSON data. If it's not available from your OS vendor, see [its website](https://stedolan.github.io/jq/).

### Command is available: n

**n** is a node version manager. Similar and alternative to **nvm**.

### Command is available: php

PHP is needed all around the build process for Jetpack bundles.

### Command is available: phpunit

PHPUnit is the tool that helps us run unit tests for Jetpack.

### Docker images are available

The containers for the Jetpack docker images are created when you ran `yarn docker:up`.

### Docker containers are available

The containers for the Jetpack docker containers are created when you ran `yarn docker:up`.

### Docker containers are running

If you are using the Jetpack Docker Image, make sure you run `yarn docker:up`.

### Docker is running

Make sure the Docker Daemon is running.

### Node Modules are available

The directory `node_modules` is where Jetpack's JavaScript dependencies live. It gets initialized by doing:

```sh
yarn
```

### Node version is proper

We need to keep our Node version requirements updated frequently.

Confirm your version of node by running the following command and check that it satisfies the requirements stated in the doc [Development Environment](https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md).

```sh
node -v
```

### NVM is available

The `nvm` command is not _really_ needed but it's a tool that allows you to install multiple Node versions.

You can also work with any global `node` command.

### Repo is up to date

Make sure you have the latest changes from the GitHub branch `master` in your local copy of `master` of the Jetpack repo.
Make sure you have no changes staged and then.

```
git checkout master
git fetch origin && git rebase
```

### Repo origin scheme is GIT

Sometime one clones the Jetpack repo from the GitHub HTTP URL of the repo and thus we're not able to use SSH key authentication for pushing to the repo.

The proper way to clone the Jetpack repository is to use the git URL for it.

```sh
git clone git@github.com:Automattic/jetpack.git
```

### Vendor dir is available
The directory `vendor` is where Jetpack's PHP dependencies live. It gets initialized by doing:

```sh
composer install
```
