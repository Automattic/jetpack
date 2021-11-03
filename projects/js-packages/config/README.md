# Jetpack Config

When consuming Jetpack JS packages, we need to provide some additional configuration in the webpack config file of our project.

In order to do that, we use the `externals` property:

```JS
	externals: {
		...baseConfig.externals,
		jetpackConfig: JSON.stringify( {
			plugins_slug: 'my-plugin-slug',
		} ),
	}
```

Note: If Webpack's [`libraryTarget`](https://webpack.js.org/configuration/output/#outputlibrarytarget) is set, you may need to override the target for the external by doing `jetpackConfig: 'var ' + JSON.stringify(...`.

## Required configuration

We only have one required configuration so far, which is `plugin_slug`. Use the same slug you used when you invoke `Config.ensure` PHP method to require that your plugin used the connection (if you did so).

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

config is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

