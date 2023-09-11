# getProductCheckoutUrl

Helper function useful to build the product checkout URL.

## API

The function expects the following params:

### productSlug
This is the WordPress.com product slug.
For instance, for security bundle it's usually defined with `jetpack_security_t1_yearly`.

### siteSuffix
Site slug suffix to be used as part of Calypso URLs. Take adventage of [get_site_suffix](../../../../packages/status/src/class-status.php#L327) backend helper

### redirectUrl
The URL to redirect to after checkout.

### isUserConnected
Boolean value that defined whether the user is connected, or not.
It will affect the built URL by adding the unlinked param to the query string.

```jsx
import { getProductCheckoutUrl } from '@automattic/jetpack-components';

const checkoutUrl = useProductCheckoutWorkflow(
	'jetpack_security_t1_yearly',
	'poweredsite.wordpress.com',
	'https://poweredsite.wordpress.com/wp-admin/admin.php?page=jetpack-protect',
	true
);
```
