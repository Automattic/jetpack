# Jetpack Protect

Jetpack Protect plugin


**If you are not planning on developing with Jetpack Protect, you should install Jetpack Protect from pre-built sources.** Details on that may be found [on this page](https://github.com/Automattic/jetpack-protect-production).

## Developing

### Debug helper plugin

Use the [Jetpack Debug Helper plugin](https://github.com/Automattic/jetpack/tree/trunk/projects/plugins/debug-helper) to mock different scan results and application states. The plugin will allow you to emulate different responses from the server so you can work on all the different statuses the plugin support.

### Bypassing the cache

If you want to force Protect to always fetch data from the server you can use the constant below:

`JETPACK_PROTECT_DEV__BYPASS_CACHE` - will ignore the cached results and will always request fresh data from WPCOM servers.

Be aware that a request to the server will be made in all admin pages! Use it only for debugging.

### Component Storybooks

[Storybook](https://storybook.js.org/) is available for developing UI components in isolation.

Run `pnpm run storybook:dev` in `projects/js-packages/storybook` to get started.

### React Query Browser Tools

This project also includes [React Query Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools).

Whenever the application is running in development mode (i.e. via `jetpack watch`), the tools will be available in the plugin via a floating icon in the bottom right corner.

## Contribute

Please refer to the [Contribute](https://github.com/Automattic/jetpack/blob/trunk/readme.md#contribute) section in the README.md file at the root of the repository.

## Security

Please refer to the [Security](https://github.com/Automattic/jetpack/blob/trunk/readme.md#security) section in the README.md file at the root of the repository.

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Protect is licensed under [GNU General Public License v2 (or later)](../../../LICENSE.txt)
