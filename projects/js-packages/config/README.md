# Jetpack Config

When consuming Jetpack JS packages, we need to provide some additional configuration in the webpack config file of our project.

In order to do that, we use the `externals` property:

```JS
	externals: {
		...baseConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'my-plugin-slug',
		} ),
	}
```

Note: If Webpack's [`libraryTarget`](https://webpack.js.org/configuration/output/#outputlibrarytarget) is set, you may need to override the target for the external by doing `jetpackConfig: 'var ' + JSON.stringify(...`.

## Required configuration

We only have one required configuration so far: 

* **`consumer_slug`**: The identifier of the app that's consuming the RNA packages. In most of the cases, this will be the plugin slug. Use the same slug you used when you invoke `Config.ensure` PHP method to require that your plugin used the connection (if you did so). This is used by the `jetpack-api` package to identify what plugin is making the requests.

## Usage

Once registered in webpack config file, all values will be available to all modules in the bundle. Use the provided function to access them:

```JS
import { jetpackConfigHas, jetpackConfigGet } from '@automattic/jetpack-config';

const consumer_slug = jetpackConfigGet( 'consumer_slug' );
```

**jetpackConfigHas** - Returns a boolean indicating whether the config was declared or not

**jetpackConfigGet** - Returns the value of a given config and throws an error if the config was not declare.

Use `jetpackConfigHas` to check if the config exists before getting its value only when it's not a required information. If your app requires a configurtion to be set, let the app throw the error and tell the developer they need to add it to their config.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

config is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

