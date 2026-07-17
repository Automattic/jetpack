# Contributing to Jetpack

This is a quick reference for common commands used during development. Please keep detailed explanations and documentation in separate external files. For broader contribution guidelines, see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Tooling

- PHP
- Node.js
- pnpm
- Composer
- Docker

See the [Quick Start guide](docs/quick-start.md) or [Development Environment guide](docs/development-environment.md) for full setup instructions.

## Jetpack CLI

Most tasks use the Jetpack CLI. There are two options:

- **`jetpack`**: runs in your local environment. See [tools/cli/README.md](tools/cli/README.md) for details.
  - You can invoke it as `pnpm jetpack` from within the monorepo.
  - Optionally, you can link it to your path so you can just type `jetpack` (`pnpm install && pnpm jetpack cli link`).
- **`jp`**: runs commands inside Docker, avoiding local version mismatches. Install globally with `npm install -g @automattic/jetpack-cli`. See [projects/js-packages/jetpack-cli/README.md](projects/js-packages/jetpack-cli/README.md).

The examples below use `jetpack`; prefix with `pnpm` if you haven't linked it or use `jp` as desired.

## Initial install

Install root dependencies:

```sh
pnpm install      # JS dependencies
composer install  # PHP dependencies
```

## Build
```sh
jetpack build --all               # build all projects
jetpack build <project>           # build a specific project (e.g. plugins/jetpack)
jetpack build <project> --deps    # build a specific project with its dependencies
jetpack watch <project>           # watch and rebuild on changes
```

## Tests
```sh
jetpack test php <project>       # PHP tests (e.g. PHPUnit)
jetpack test js <project>        # JS tests (e.g. Jest)
jetpack docker phpunit jetpack   # Run Jetpack PHPUnit tests within Docker container
```

See [Automated Testing](docs/automated-testing.md) for full details and setup requirements.

## Linting and static analysis
```sh
pnpm lint                    # JS/TS (ESLint)
pnpm lint-style              # CSS/SCSS (Stylelint)
composer phpcs:lint <path>   # PHP (PHPCS)
jetpack phan <project>       # Static analysis (Phan)
```

See [Coding Guidelines](docs/coding-guidelines.md) for standards and conventions.

## Changelog
Every PR touching `/projects` requires a changelog entry:

```sh
jetpack changelog add   # interactive

# or non-interactive:
jetpack changelog add <project> -s patch -t fixed -e "Implement Unicord."
```

See [Writing a Good Changelog Entry](docs/writing-a-good-changelog-entry.md).

## Local WordPress environment
```sh
jetpack docker up -d     # start the container
jetpack docker install   # initialize the WordPress install
jetpack docker down      # stop the container
```

See the [Docker guide](tools/docker/README.md) for details.

## Repository structure

```
projects/                  # All monorepo projects
  plugins/                 #   WordPress plugins (jetpack, boost, backup, etc.)
  packages/                #   Shared PHP packages
  js-packages/             #   Shared JavaScript/TypeScript packages
  github-actions/          #   Reusable GitHub Actions
tools/                     # Monorepo utilities, scripts, and Docker setup
docs/                      # Developer documentation
```
