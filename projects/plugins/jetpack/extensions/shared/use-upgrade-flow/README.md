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

This data is provided by the `wordpress-com/plan` store registered by the [upgrade-nudge](../upgrade-nudge/store.js) shared component, which is populated by the response of the `https://public-api.wordpress.com/rest/v1.5/plans` request.
The following is a quite accurate shape of the personal plan:

```js
{
	product_id: 2005,
	product_name: "Jetpack Personal",
	meta: null,
	bd_slug: "jetpack-personal",
	bd_variation_slug: "jetpack-personal-yearly",
	sale_coupon_applied: false,
	sale_coupon: null,
	multi: 0,
	cost: 39,
	blog_id: null,
	product_slug: "jetpack_personal",
	description: "",
	bill_period: 365,
	product_type: "bundle",
	available: "yes",
	outer_slug: null,
	extra: null,
	capability: "manage_options",
	product_name_short: "Personal",
	icon: "https://s0.wordpress.com/i/store/plan-business.png",
	icon_active: "https://s0.wordpress.com/i/store/plan-business-active.png",
	bill_period_label: "per year",
	price: "$39",
	formatted_price: "$39",
	raw_price: 39,
	tagline: null,
	currency_code: "USD"
}
```