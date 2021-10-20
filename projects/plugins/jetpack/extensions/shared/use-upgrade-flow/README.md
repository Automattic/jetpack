## useUpgradeFlow hook

Use this hook when you need to implement a component that leads the user to the checkout page.

### Usage

```es6
/**
 * Internal dependencies
 */
import useUpgradeFlow from '../../shared/use-upgrade-flow/index';

const myUPgradeComponent = () => {
	const [ checkoutUrl, goToCheckoutPage, isRedirecting ] = useUpgradeFlow( 'business-bundle' );
	return (
		<Button href={ checkoutUrl } onClick={ goToCheckoutPage } isBusy={ isRedirecting }>
			CheckOut!
		</Button>
	);
};
```

### API

`const [ checkoutUrl, goToCheckoutPage, isRedirecting ] = useUpgradeFlow( planSlug, onRedirect );`

#### Arguments

The hook accepts two arguments.

- `planSlug` (`string`) - Slug of plan to purchase
- _(optional)_ `onRedirect` (`(string) => void`) - callback function that will
  be run when the redirect process triggers. The new URL is passed.

### Return Values

The hook returns an array with three items.

- `checkoutUrl` (`string`): The checkout URL. You can use this value to set the href of an anchor element.
- `goToCheckoutPage` (`(event) => void`): Callback to be used in an onClick event.

Redirects the user to the checkout URL, checking before whether the current
post/page/etc has changes to save. If so, it saves them before to redirect.

- `isRedirecting` (`bool`): If the component is in the process of redirecting the
  user. It may be waiting for a save to complete before redirecting. Use
  this to set a button as busy or in a loading state.

- `planData` (`object`) An object with full data about the plan.
