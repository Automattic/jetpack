API Package
=========

The package includes the API class for communicating with Jetpack's internal APIs.

It exports a singleton REST API client used by Jetpack's admin apps to talk to the `jetpack/v4` (and related) endpoints, covering connection management, modules, settings, plans, recommendations, and more.

## Usage

Install the package:

```bash
pnpm add @automattic/jetpack-api
```

Initialize the client with the API root and nonce (usually provided by the consuming plugin via an initial state object), then call any of its methods:

```js
import restApi from '@automattic/jetpack-api';

restApi.setApiRoot( 'https://example.org/wp-json/' );
restApi.setApiNonce( '12345' );

const status = await restApi.fetchSiteConnectionStatus();
```

All methods return promises. Responses with non-2xx status codes are rejected with one of the exported custom error classes, so consumers can handle specific failure modes:

```js
import restApi, {
	JsonParseError,
	JsonParseAfterRedirectError,
	Api404Error,
	Api404AfterRedirectError,
	FetchNetworkError,
} from '@automattic/jetpack-api';
```

### Consumer slug

Some endpoints (such as site registration) identify the calling plugin via the `consumer_slug` value from the [`@automattic/jetpack-config`](https://github.com/Automattic/jetpack/tree/trunk/projects/js-packages/config) package. Make sure your app's webpack configuration declares it via the `externals` property:

```js
externals: {
	...baseConfig.externals,
	jetpackConfig: JSON.stringify( {
		consumer_slug: 'my-plugin-slug',
	} ),
},
```

## Development

From the monorepo root:

```bash
jetpack install js-packages/api   # Install dependencies
jetpack test js js-packages/api   # Run the Jest test suite
```

## Contribute

We welcome contributions from the community. Please submit your pull requests on the GitHub repository.

## Get Help

If you encounter any issues or have any questions, please open an issue on the GitHub repository.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

The API package is licensed under the GNU General Public License v2 (or later).
