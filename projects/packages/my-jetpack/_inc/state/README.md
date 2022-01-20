# State

## Selectors

### Products

#### getProducts

#### getProductNames

#### isValidProduct

## Side Effects

Side effects are useful to handle data asynchronously. By default, Redux actions do it synchronously.
The following is an example of how to handle async data with the data My Jetpack approach:

Let's suppose you need to implement an action to activate a product, let's say `backup`.

## 1st
So, the first step is defining a simple action that will start to take over it.

```es6
export function requestActivateProduct( productId ) {
	return {
		type: 'ACTIVATE_PRODUCT',
		productId,
	};
}
```

So far pretty simple. When the action runs it dispatches the `ACTIVATE_PRODUCT` action, passing the productId in the action object to be consumed by the reducer. But...

### 2do

... this action requires async handling by its nature. We need to link the client with the backend in order to propagate these changes to the system. In other words, hit an endpoint, wait for its response and update the data locally. We call it a side effect.

Since the reducer expects an action object, and only an action object, we need to catch the action to implement this especial async behavior in between, and (maybe) dispatch other actions. This is the middleware.

To add the side effect to _observe_ the `ACTIVATE_PRODUCT` action , let's add a key to the [effects.js](./effects.js) object with its respective handler.

```es6
function requestActivateProduct( action, store ) {
	const { productId } = action;
	const { getState, dispatch } = store;

	// Check valid product.
	const isValid = isValidProduct( getState(), productId );
	if ( ! isValid ) {
		return dispatch(
			setProductActionError( {
				code: 'invalid_product',
				message: __( 'Invalid product name', 'jetpack-my-jetpack' ),
			} )
		);
	}

	apiFetch( {
		path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
		method: 'POST',
		data: {
			action: 'activate',
		}
	} )
	.then( ( res ) => dispatch( activateProduct( res ) ) )
	.catch( error => dispatch( setProductActionError( error ) ) );
};

export default {
	'ACTIVATE_PRODUCT': requestActivateProduct,
};
```

The middleware provides the `action` and the `store` to the side-effect handler, all that we need to handle the action from there.