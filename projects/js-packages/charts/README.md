# Automattic Charts

A comprehensive charting library for displaying interactive data visualizations within Automattic products. Built on top of modern libraries like `@visx/xychart` and designed for accessibility, responsiveness, and ease of use.

Explore the available charts and their documentation in [Storybook](https://automattic.github.io/jetpack-storybook/?path=/docs/js-packages-charts-docs--docs).

## Quick Start

### Installation

```bash
npm install @automattic/charts
# or
pnpm add @automattic/charts
# or
yarn add @automattic/charts
```

### Local development with Storybook

To run Storybook locally, from the root of the monorepo follow these steps:

1. Run `pnpm install` to install the dependencies.
2. Run `cd projects/js-packages/charts` to navigate to the charts package.
3. Run `pnpm run storybook` to start the storybook server.

## Contributing

Ready to contribute? Check out the [Jetpack contributing guide](https://github.com/Automattic/jetpack/blob/trunk/docs/CONTRIBUTING.md) and the [Charts AI documentation guide](https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/charts/docs/ai-documentation-guide.md) for detailed information on adding new features and documentation.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Charts is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
