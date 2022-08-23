# Quick Start Guide

## Overview

This guide is designed to get you up and running working with the Jetpack Monorepo quickly following recommended and supported guidelines.

This guide assumes you are using MacOS or a Linux machine and are an Automattician. For more detailed information, including alternate local dev environments, running unit tests, best coding practices, and more, you can use the [full Development Environment guide here](development-environment.md#clone-the-repository). 

## Installation

### Using the installation script

To speed up the installation process, you may use our monorepo installation script. To do so:
 - clone the Jetpack repo using one of these two methods: 
 	- A public SSH key ([recommended](https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#clone-the-repository)): `git clone git@github.com:Automattic/Jetpack.git` 
	- HTTPS: `git clone https://github.com/Automattic/jetpack.git` 
 - `cd` into the cloned `jetpack` folder.
 - run `tools/install-monorepo.sh` from the monorepo root.
 Once the installation is complete, continue onto the section [Running Jetpack locally](#running-jetpack-locally). 

### Installing manually

Prior to installation, we recommend using [`Homebrew`](https://brew.sh/) to manage installations and [`nvm`](https://github.com/nvm-sh/nvm/) to manage Node.js versions. If you don't already have those installed, you can do so by copy/pasting each of the following commands and running them in your terminal:

- Homebrew: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- nvm: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`

The Jetpack Monorepo requires various software to be installed on your machine.
- Start by cloning the GitHub repo using one of these two methods:
	- A public SSH key ([recommended](https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#clone-the-repository)): `git clone git@github.com:Automattic/Jetpack.git` 
		- HTTPS: `git clone https://github.com/Automattic/jetpack.git` 
		- If you're not an Automattician, you can [fork the repo following the instructions here](https://docs.github.com/en/get-started/quickstart/contributing-to-projects).
	- Note that the Monorepo should not be cloned into the WordPress plugins directory (you will see a warning on your plugins page in that case saying that the Jetpack Monorepo is not a plugin and shouldn't be installed as one). If you are not cloning into a Docker environment, read the [full Development Environment guide here](development-environment.md#clone-the-repository) to find out how to add symlinks.
- This software needs to be installed or updated system-wide:
	- Bash (will need to be updated from default Mac version): `brew install bash`
	- jq (JSON processor used in scripts): `brew install jq` 
- To install or update the following software, cd into the Jetpack directory that was created when cloning the repo: `cd jetpack`:
	- Node.js (used for build process and our CLI): `nvm install && nvm use`
	- PNPM (a Node.js package manager): `npm install -g pnpm`
	- PHP (the language at the core of the WordPress ecosystem): `source .github/versions.sh && brew install php@$PHP_VERSION`
	- Composer (our PHP package manager): `brew install composer`
	- Jetpack CLI (an internal tool that assists with development): `pnpm install && pnpm jetpack cli link`
		- [You can read more about using the CLI here](https://github.com/Automattic/jetpack/blob/trunk/tools/cli/README.md).

## Running Jetpack locally

After everything is installed, you're ready to run Jetpack locally! While there are other supported methods of doing this, we recommend and support using Docker containers. 

To setup Docker:
- Install Docker:
	- Mac: `brew install --cask docker` (This will take a while!)
	- Linux: `brew install docker` 
	- `open -a Docker` (or open the app from your Applications folder) to open the GUI application. You will likely need to enter your device password and accept their terms for a first time setup.
- Copy the settings file from within the monorepo root: `cp tools/docker/default.env tools/docker/.env`
- Open `tools/docker/.env` and make any modifications you'd like.	
	- It's strongly recommend you at least change `WP_ADMIN_PASSWORD` to something more secure.
- Start the Docker container using `jetpack docker up -d` (this may take some time for the first setup)
- Install WordPress in your Docker container using `jetpack docker install` 
- Open up http://localhost to see your site!

For more in depth Docker instructions, follow the [Docker environment for Jetpack Development guide](../tools/docker/README.md).

### Setting up Jurassic Tube

In order to test features that require a WordPress.com connection and other network related Jetpack features, you'll need a test site that can create local HTTP tunnels. If you're an Automattician, we recommend using Jurassic Tube:

**Warning: This creates a tunnel to your local machine which should not be trusted as secure. If it is compromised, so is your computer and everything it has access to. Only `jetpack docker jt-up` when needed for testing things that require the site to be publicly accessible, and `jetpack docker jt-down` when completed.**

- Visit the [jurassic.tube](https://jurassic.tube/) homepage to create a subdomain
- Make sure you've run `pnpm install && pnpm jetpack cli link`
- Make sure Docker is running `jetpack docker up -d`
- Stand on the monorepo root in your terminal and run `mkdir tools/docker/bin/jt`
- Stop and restart the docker env: `jetpack docker stop && jetpack docker up -d`
- Download and run the installation script: `curl "https://jurassic.tube/get-installer.php?env=jetpack" -o tools/docker/bin/jt/installer.sh && chmod +x tools/docker/bin/jt/installer.sh && tools/docker/bin/jt/installer.sh`
- Set your username: `jetpack docker jt-config username [your-username-here e.g david]`
- Set your subdomain: `jetpack docker jt-config subdomain [your-subdomain-here e.g. spaceman]` 
- Now, you can start your site with `jetpack docker jt-up`
- Your site should be avalable at `https://custom-subdomain.jurassic.tube`

Note: This is for Automattician use only. For other methods, check out [ngrok](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md#using-ngrok-with-jetpack) or [another similar service](https://alternativeto.net/software/ngrok/).

### Check if your environment is ready for Jetpack development

We provide a script to help you in assessing if everything's ready on your system to contribute to Jetpack.

```sh
tools/check-development-environment.sh
```

Running the script will tell you if you have your environment already set up and what you need to do in order to get it ready for Jetpack development:

- All green `YES` or `OK` messages mean you're ready to start
- Red `NO` messages mean something is wrong or missing, and a link will be provided to help you with a fix.
- Yellow messages indicate something optional is broken or missing.

#### Running Tests

To run PHP, JS, and coverage tests, you can use the Jetpack CLI: `jetpack test` and then choose the project and type of test you'd like to run.

# Development Workflow

Once you have a local copy of Jetpack and all development tools installed, you can start developing.

1. Make sure the plugin you're developing is activated on your WordPress site.
2. [Build your project](#building-your-project) using `jetpack build [type/project]`, such as `jetpack build plugins/jetpack`
3. Access the plugin's dashboard in your browser.

By default the development build above will run once and if you change any of the files, you need to run `jetpack build` again to see the changes on the site. If you want to avoid that, you can run a continuous build that will rebuild anytime it sees any changes on your local filesystem. To run it, use:

```sh
jetpack watch
```

That's all! 

