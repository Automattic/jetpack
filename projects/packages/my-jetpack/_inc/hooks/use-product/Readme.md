# useProduct

Simple React custom hook that provides data and helpers to handle a My Jetpack product.

## API

```es6
const { isActive, activate } = useProduct( <product-id> );
```

The `useProduct()` hooks returns an object with the following properties:

### isActive
Whether the product is active, or not.

### isFetching
Whether a request about the product is being requested. Use it when you'd like to change the UI depending on this state, for instance.

### detail
An object with details about the product.

### productsList

Returns the current products list of My Jetpack.

### activate( <productSlug> )
A helper function to activate a product.

```es6
import usePlan from './hooks/use-products';

function PlansSection() {
	const { detail, activate, isFetching } = useProduct( 'backup' );

	return (
		<div className="product">
			<h4>{ detail.name }</h4>
			<p>{ detail.description }</p>
			<Button onClick={ activate } disabled={ isFetching }>Activate</Button>
		</div>
	)
}
```
