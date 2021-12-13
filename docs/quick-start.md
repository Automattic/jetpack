# Quick Start Guide

## Overview

This guide is designed to get you up and running working with the Jetpack Monorepo quickly following recommended and supported guidelines. For more detailed information, including alternate local dev environments, running unit tests, best coding practices, and more, you can the [full Development Environment guide here](docs/development-environment.md#clone-the-repository). 

## Installation

Prior to installation, we recommend using [`Homebrew`](https://brew.sh/) to manage installations and [`nvm`](https://github.com/nvm-sh/nvm/) to manage Node.js versions. If you don't already have those installed, you can do so by copy/pasting each of the following commands and running them in your terminal:

- Homebrew: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- nvm: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`

The Jetpack Monorepo requires the following to be installed on your machine:

- Node.js (used for build process and our CLI): `nvm install`
	- You can see the current latest supported version of Node.js in the monorepo root's [`package.json`](https://github.com/Automattic/jetpack/blob/master/package.json) under `engines`
	- You can switch versions of node using nvm: `nvm ls` to list installed versions of node, `nvm use [version number]` to switch.
- PNPM (a Node.js package manager): `npm install -g pnpm`
- Composer (our PHP package manager): `brew install composer`
- PHP (the language at the core of the WordPress ecosystem): `brew install php@8.0`
- Once the pre-requisites are installed, you can clone the GitHub repo:
	- `git clone https://github.com/Automattic/jetpack.git`
	- If you're not an Automattician, you can [fork the repo following the instructions here](https://docs.github.com/en/get-started/quickstart/contributing-to-projects).
- Jetpack CLI (an internal tool that assists with development): `pnpm install && pnpm cli-setup`
	- [You can read more about using the CLI here](https://github.com/Automattic/jetpack/blob/master/tools/cli/README.md).

## Running Jetpack locally

After everything is installed, you're ready to run Jetpack locally! While there are other supported methods of doing this, we recommend and support using Docker containers. 

To setup Docker:
- Run `brew install --cask docker` or [download the latest version here](https://www.docker.com/products/docker-desktop). 
- Copy the settings file so you can modify passwords and other configurations: `cp tools/docker/default.env tools/docker/.env`
- Start the Docker container using `jetpack docker up`
- Install WordPress in your Docker container using `jetpack docker install` 
- Open up http://localhost to see your site!

For more in depth docker instructions, follow the [Docker environment for Jetpack Development guide](../tools/docker/README.md).

### Setting up Jurassic Tube

To test network related features of Jetpack, you'll need a test site that can create local HTTP tunnels. If you're an Automattician, we recommend using Jurassic Tube:

- Add a subdomain on [jurassic.tube](https://jurassic.tube/)
- Make sure Docker is running `jetpack docker up -d`
- Make sure you've run `pnpm install && pnpm cli-link`
- Stand on the monorepo root in your terminal and run `mkdir tools/docker/bin/jt`
- Run the installation script: `chmod +x tools/docker/bin/jt/installer.sh && tools/docker/bin/jt/installer.sh`
- Use `jetpack docker jt-up your-username custom-subdomain` to start the site.
- Your site should be avalable at `https://custom-subdomain.jurassic.tube`

*Optional*

To make things easier, you can configure Jurassic Tube to remember your username and subdomain.

Let’s assume somebody with WP.com username david uses the URL https://spaceman.jurassic.tube:

- Set your username: `jetpack docker jt-config username [your-username-here e.g david]`
- Set your subdomain: `jetpack docker jt-config subdomain [your-subdomain-here e.g. spaceman]` 
- Now, you can start your site with `jetpack docker jt-up`

Note: This is for Automattician use only. For other methods, check out [ngrok](https://github.com/Automattic/jetpack/blob/master/tools/docker/README.md#using-ngrok-with-jetpack) or [another similar service](https://alternativeto.net/software/ngrok/).

### Check if your environment is ready for Jetpack development

We provide a script to help you in assessing if everything's ready on your system to contribute to Jetpack.

```sh
tools/check-development-environment.sh
```

Running the script will tell you if you have your environment already set up and what you need to do in order to get it ready for Jetpack development.

If you're ready to start, you should see all green `SUCCESS` messages. If the script detect issues, you will see a a red `FAILED` note and a link that will help you figure out what you need to change/fix to address the issue.

# Development workflow

Once you have a local copy of Jetpack and all development tools installed, you can start developing.

1. Make sure the plugin you're developing is activated on your WordPress site.
2. [Build your project](#building-your-project) using `jetpack build [type/project]`, such as `jetpack build plugins/jetpack`
3. Access the plugin's dashboard in your browser.

By default the development build above will run once and if you change any of the files, you need to run `jetpack build` again to see the changes on the site. If you want to avoid that, you can run a continuous build that will rebuild anytime it sees any changes on your local filesystem. To run it, use:

```sh
jetpack watch
```

That's all! 

