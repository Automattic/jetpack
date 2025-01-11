# Quick Start Guide

## Overview

This guide will get you up and running with Jetpack development as quickly as possible using our recommended tools.

**Prerequisites**: You'll need:
- Node.js installed (any recent LTS version)
- Git installed and configured
- Docker installed and running

## Installation

1. Install the Jetpack CLI:
```bash
npm install -g @automattic/jetpack-cli
```

2. Initialize Jetpack:
```bash
jp init
```

This will:
- Clone the Jetpack monorepo to your chosen location
- Guide you through the next steps to get started

## Development Workflow

Build and test your changes:
```bash
# Build a specific project with dependencies
jp build plugins/jetpack --deps

# Or watch for changes
jp watch plugins/jetpack

# Run tests
jp test
```

## Testing with Docker

Jetpack includes a testing environment using Docker. To start testing:

1. Start the testing environment:
```bash
jp docker up -d
```

2. Install WordPress (first time only):
```bash
jp docker install
```

3. Visit http://localhost to see your site!

## Testing WordPress.com Features

To test features requiring a WordPress.com connection:

### For Automatticians:
Use Jurassic Tube:
```bash
jp docker jt-up
```

### For External Contributors:
Use ngrok:
```bash
jp docker ngrok-up
```

## Setting up Jurassic Tube

In order to test features that require a WordPress.com connection and other network related Jetpack features, you'll need a test site that can create local HTTP tunnels. If you're an Automattician, we recommend using Jurassic Tube.

Note: This is for Automattician use only. For other methods, check out [ngrok](../tools/docker/README.md#using-ngrok-with-jetpack) or [another similar service](https://alternativeto.net/software/ngrok/).

**Warning: This creates a tunnel to your local machine which should not be trusted as secure. If it is compromised, so is your computer and everything it has access to. Only `jp docker jt-up` when needed for testing things that require 
the site to be publicly accessible, and `jp docker jt-down` when completed.**

- Visit the [jurassic.tube](https://jurassic.tube/) homepage to create a subdomain
- Make sure you've run `npm install -g @automattic/jetpack-cli`
- Make sure Docker is running `jp docker up -d`
- Stand on the monorepo root in your terminal and run `mkdir tools/docker/bin/jt`
- Stop and restart the docker env: `jp docker stop && jp docker up -d`
- Download and run the installation script: `curl "https://jurassic.tube/get-installer.php?env=jetpack" -o tools/docker/bin/jt/installer.sh && chmod +x tools/docker/bin/jt/installer.sh && tools/docker/bin/jt/installer.sh`
- Set your username: `jp docker jt-config username [your-username-here e.g david]`
- Set your subdomain: `jp docker jt-config subdomain [your-subdomain-here e.g. spaceman]` 
- Now, you can start your site with `jp docker jt-up`
- Your site should be available at `https://custom-subdomain.jurassic.tube`

That's all! For more detailed information, see the [Development Environment guide](development-environment.md).
