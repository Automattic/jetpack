# Jetpack Boost

Jetpack Boost gives your site the same performance advantages as the world’s leading websites, no developer required. 

## How to install Jetpack Boost

**If you are not planning on developing with Jetpack Boost, you should install Jetpack Boost from pre-built sources.** Details on that may be found [on this page](https://github.com/Automattic/jetpack-boost-production).

## Development

### Live-reloading CSS

The live-reload feature is configured to only reload CSS files. Currently the way our rollup/webpack combination is configured - every change results in a full rebuild of the JS files, so even style changes would trigger a full page refresh.

If you want to use the live-reloading feature, you have to install the [Livereload extension](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en) (for Chrome) and then run

```sh
npm run devlive
```

### Installation from Git repo

Please refer to the [Development guide](./docs/DEVELOPEMENT_GUIDE.md) section of Jetpack Boost documentation.

## Contribute

Please refer to the [Contribute](https://github.com/Automattic/jetpack/blob/trunk/readme.md#contribute) section in the README.md file at the root of the repository.

## Security

Please refer to the [Security](https://github.com/Automattic/jetpack/blob/trunk/readme.md#security) section in the README.md file at the root of the repository.

## License

Jetpack Boost is licensed under [GNU General Public License v2 (or later)](../../../LICENSE.txt)
