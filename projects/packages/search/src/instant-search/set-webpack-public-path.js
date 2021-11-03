// NOTE: Setting this free variable allows us to modify Webpack's public path, enabling us to use
//       dynamic imports. Also note that we don't import any other file to ensure that this operation is
//       completed before any other module imports. See:
//       https://github.com/webpack/webpack/issues/2776#issuecomment-233208623
// eslint-disable-next-line no-undef
__webpack_public_path__ = window.JetpackInstantSearchOptions.webpackPublicPath;
