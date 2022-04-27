# useProductCheckoutWorkflow

Custom hook that performs the needed steps to concrete the checkout workflow.
For this, it'll try to regiter the site in case it's disconnected, and then it'll redirect to the checkout page.
The hook delegates the task to connect the user when it's disconnected, adding a unlinked=1 to the checkout URL.

## API

The hook expects the following arguments:

### productSlug
This is the WordPress.com product slug.
For instance, for security bundle it's usually defined with `jetpack_security_t1_yearly`.

### siteSuffix
Site slug suffix to be used as part of Calypso URLs. Take adventage of [get_site_suffix](../../../../packages/status/src/class-status.php#L327) backend helper

### redirectUrl
The URL to redirect to after checkout.

The hook returns an object with the following keys:

### run
Helper function to run the checkout process. Usually, you'd like to add this function as an event callback.

```jsx
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';

function MyComponent() {
	const { run } = useProductCheckoutWorkflow( {
		productSlug: 'jetpack_security_t1_yearly',
		siteSuffix: 'poweredsite.wordpress.com'
		redirectUrl: 'https://poweredsite.wordpress.com/wp-admin/admin.php?page=jetpack-protect',
	} );

	return (
		<Button onClick={ run }>Add Security plan!</Button>
	)
}
```
