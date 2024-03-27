# Coding Standards & Guidelines

These are some things to keep in mind when writing code for the Jetpack Monorepo ecosystem. Please follow them to speed up the review process and get your code merged faster.

## Language and tools

- **PHP**: Jetpack Monorepo projects rely on WordPress' minimum PHP version requirements by default. There are several exceptions, however, which we will get to later in this document.
- **PHP Standards**: Jetpack follows [WordPress Core's standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/), with a few additions. The best way to ensure that you adhere to those standards is to set up your IDE [as per the recommendations here](./development-environment.md#use-php-codesniffer-and-eslint-to-make-sure-your-code-respects-coding-standards).
- **WordPress**: Jetpack supports the current version of WordPress and the immediate previous version. So if the current version is 4.6, Jetpack will support it, as well as 4.5. It's desirable that when Jetpack is installed in older versions, it doesn't fail in a severe way.
- **JavaScript**: Jetpack Monorepo uses NodeJS as the engine, and version wise it follows Calypso, usually meaning staying on the current LTS version. The package manager is the latest version of PNPM. 
- **Frontend JavaScript**: The Jetpack Monorepo standard is Webpack, Babel, Gutenberg, and React stack. (The preferred configuration)[https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/webpack-config/README.md] that is shared among all projects is in the `projects/js-packages/webpack-config` project. This is done to make sure that Babel handles browser compatibility.
- **Other JavaScript**: Teams are free to use other stacks for their projects, and we do have projects that use Svelte with Rollup, for example. In practice it usually means that the team is largely responsible for supporting custom solutions like this, including i18n and updates. There's a notable "conflict" where we would like to avoid bringing in `18n-calypso` for i18n, since Jetpack generally uses translate.wordpress.org which requires Gutenberg's `@wordpress/i18n`.
- **Linting and testing JavaScript**: We have generally settled on `jest` and `@testing-library/*` for unit testing.  Linting is done with `eslint`, with most configuration at the Monorepo level. Ideally projects should be sparing in overriding the eslint config beyond selecting the appropriate presets for `react`/`typescript`/etc.
- **E2E tests**: The situation is a bit complicated:
  - We've settled on `playwright` for standalone E2E tests. `allure-playwright` is the direct dependency that brings in `playwright` as a sub-dependency.
  - For tests against Simple and Atomic, however, those live in [the Calypso repo](https://github.com/Automattic/wp-calypso).
- **General dependencies**: When it comes to dependencies in general, and particularly large ones, it's good practice to choose options already used in the Monorepo and to try to match the versions too.
  - If some other option is better that what we're currently using, it may be worth starting a project to switch everything to the new option.
  - When consuming monorepo `js-packages` within the Monorepo, the package should provide `jetpack:src` entries in `.exports` in `package.json` to avoid having to build before `eslint` can run. Do not use `.scripts.prepare` or the like to try to compile on installation, as that slows down and complicates installation for everyone even if they're not using that js-package.
- **Browsers**: Jetpack Monorepo follows Gutenberg's browser support guidelines by [relying on the `browserlist-config` package](https://make.wordpress.org/core/handbook/best-practices/browser-support/).

### Project based language and tool versions 

If you take a look at the contents of the `projects` folder, you can see that the Monorepo has several types of projects. Some of them can have specific requirements that further extend the base requirements. The most obvious examples of that are plugins that require later PHP versions than what is required by default. For instance, Jetpack CRM's `readme.txt` file states that [the minimum PHP version is 7.4](https://github.com/Automattic/jetpack/blob/a8b161eb5c6b23972d728271e0b210df4f9e586c/projects/plugins/crm/readme.txt#L7). 

## The Jetpack Monorepo and its CLI

Jetpack CLI requires PHP 8.2 and latest stable Node JS versions. Sometimes the version update lags behind for a while to make sure that [Calypso is using the same version](https://github.com/Automattic/wp-calypso/blob/trunk/.nvmrc).

Jetpack CLI is a requirement to work with Jetpack Monorepo, and it depends on the following tools:

- **Composer**: [the PHP dependency management tool](https://getcomposer.org/) is required to work with the Monorepo.
- **PNPM**: [the drop-in replacement for NPM](https://pnpm.io/) is also a requirement.

This is all you need to get going, please check the [Quick Start][quick-start.md] guide if you need help getting the correct versions installed. 

## General guidelines

- **PHPCS**: The PHP Code Sniffer [Code Sniffer rules for Jetpack Coding Standards.](https://github.com/Automattic/jetpack-codesniffer#usage) should be installed for you as a Monorepo dependency. They will make it easier for you to notice any missing documentation or coding standards you should respect. Most IDEs display warnings and notices inside the editor, making it easy to inspect your code.
- If coding a module, make sure you declare the module in the inline doc, [like this](https://github.com/Automattic/jetpack/blob/16bc2fce3ace760ff402f656dcf05255888f23f4/modules/sitemaps/sitemaps.php#L92-L101). The same applies for filters or actions, [as shown here](https://github.com/Automattic/jetpack/blob/16bc2fce3ace760ff402f656dcf05255888f23f4/modules/sitemaps/sitemaps.php#L143-L151).
- Sanitize URLs, attributes, everything. WordPress.com VIP has this nice [article about the topic](https://wpvip.com/documentation/vip-go/validating-sanitizing-and-escaping/).
- Create unit tests if you can ([here are the Jetpack plugin tests for reference](https://github.com/Automattic/jetpack/tree/trunk/projects/plugins/jetpack/tests)). If you're not familiar with Unit Testing, you can check [this tutorial](https://pippinsplugins.com/series/unit-tests-wordpress-plugins/).

## Deprecating code

When deprecating code in Jetpack (removing / renaming files, classes, functions, methods), there are a few things to keep in mind:

1. Other plugins / themes may be relying on that code, so we cannot just remove it. A quick way to gauge the use of a function can be to search for it in OpenGrok and [WPDirectory](https://wpdirectory.net/).
2. Deleting a file that was loaded and in use in the previous release can cause Fatal Errors on sites with aggressive OpCache setups.

For these reasons, here are a few guidelines you can follow:

- Instead of deleting files, mark them as deprecated first with `_deprecated_file`.
- Deprecate classes, [functions](https://developer.wordpress.org/reference/functions/_deprecated_function/), and methods in the same way, while still returning its replacement if there is one.
- Deprecated code should remain in Jetpack for 6 months, so third-parties have time to find out about the deprecations and update their codebase.
- If possible, reach out to partners who rely on deprecated code to let them know when the code will be removed, and how they can update.
- If necessary, you can publish an update guide on developer.jetpack.com to help people update.

Example usage for deprecating a function:

```
/**
 * This is an example function.
 *
 * @deprecated $$next-version$$ Give an explanation about what function to use instead.
 *
 * @return string
 */
function example_function( ) {
 
    _deprecated_function( __FUNCTION__, '{plugin/package}-$$next-version$$' );
 
   return 'example';
}
```

For more information on how to use `$$next-version$$`, please see the [packages README](../projects/packages/README.md#package-version-annotations) (relevant for plugins as well).

## Widgets

- Make them support Customizer's Selective Refresh. Here's an [article about it](https://make.wordpress.org/core/2016/03/22/implementing-selective-refresh-support-for-widgets/).
- Some Widgets ported from WordPress.com must only be registered if Jetpack is connected.
- Add the `jetpack_widget_name` filter to the widget title [as shown here](https://github.com/Automattic/jetpack/blob/447766aa676dfc78822d33af4f73535668eba063/modules/widgets/my-community.php#L37).

## Translations

### PHP

- Where it applies, make strings available for translation.
- Instead of `__`, `_e`, `_x` and similar functions, use their safe versions `esc_html__`, `esc_html_e`, `esc_html_x` and others where possible.
- Use an appropriate unique text domain in your plugin or Composer package.
- Make use of our [automattic/jetpack-composer-plugin](https://packagist.org/packages/automattic/jetpack-composer-plugin) and related packages to ensure i18n works in the published plugin.

### JavaScript and TypeScript

- Where it applies, make strings available for translation.
- Use Gutenberg's [@wordpress/i18n](https://www.npmjs.com/package/@wordpress/i18n) package.
- Use an appropriate unique text domain in your JS code.
- Make use of [@automattic/babel-plugin-replace-textdomain](https://www.npmjs.com/package/@automattic/babel-plugin-replace-textdomain) when bundling to ensure i18n works in the published plugin.
- When using TypeScript in Webpack, use `@babel/preset-typescript` rather than `ts-loader`.
  - To generate `.d.ts` files, either `fork-ts-checker-webpack-plugin` or `tsc --emitDeclarationOnly` may be used.

## Where should my code live? 

Here are some general guidelines when considering adding new functionality: 

- [Packages](../projects/packages/README.md#should-my-code-be-in-a-package)
- Modules (@todo)
- module-extras.php (@todo)
