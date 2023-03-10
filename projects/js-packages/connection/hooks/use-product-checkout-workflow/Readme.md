# useProductCheckoutWorkflow

Custom hook that performs the needed steps to concrete the checkout workflow.
For this, it'll try to regiter the site in case it's disconnected, and then it'll redirect to the Calypso checkout page.
The hook delegates the task to connect the user when it's disconnected, adding a `unlinked=1` to the checkout URL.

## API

### Arguments
The hook expects a `props` object argument with the following specs:

#### productSlug
this is the WordPress.com product slug.
#### redirectUrl
The URL to redirect to after checkout.
For instance, for security bundle it's usually defined with `jetpack_security_t1_yearly`.
#### siteSuffix (optional)
Site slug suffix to be used as part of Calypso URLs. As default, tt's defined by the [get_site_suffix()](../../../../packages/status/src/class-status.php#L327) backend helper.

And it returns also an object with the following keys:

#### run
helper function to run the checkout process. Usually, you'd like to asign this function as to an event callback.

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

#### isRegisterd
determine if the site is registered, or not. It's shortcut to the [getSiteIsRegistering](../../state/selectors.jsx#L10) selector.

#### hasCheckoutStarted*
True right after the checkout process starts. Take advantage of this prop to deal with the delay that happens when the browser starts to redirect to the checkout page.

```jsx
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';

function MyComponent() {
	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( { ... } );

	if ( hasCheckoutStarted ) {
		return <div>Going to checkout page.</div>;
	}

	return (
		<Button onClick={ run }>Add Security plan!</Button>
	)
}
```