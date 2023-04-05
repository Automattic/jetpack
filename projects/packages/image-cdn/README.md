# image-cdn

Serve images through Jetpack's powerful CDN

## How to install image-cdn

1. Run: `Automattic\Jetpack\Image_CDN\Image_CDN_Core::setup()`. You can just load it without a hook. Make sure to definitely load it before `plugins_loaded` priority 10. This should be ran regardless of if you want image-cdn to be active or not. It provides some core functionality and compatibility layer for the photon module in Jetpack.

2. When you want to activate image-cdn in images and start replacing image URLs, run `Automattic\Jetpack\Image_CDN\Image_CDN_Setup::load()`.

## Contribute
https://github.com/Automattic/jetpack

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

image-cdn is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

