# useProducts

Simple React custom hook that provides data and helpers to deal with site products.

## API

```es6
const { list: productsList, activate, deactivate } = useProducts();
```

The `useProducts()` hooks returns an object with the following properties:

### list

An array with the products list.

### activate( <slug> )
A helper function to activate a product.

### deactivate( <slug> )
A helper function to disable a product.

```es6
import usePlan from './hooks/use-products';

function PlansSection() {
	const { list: productsList, activate, deactivate } = useProducts();

	return (
		<div className="products">
			{ productsList.map( ( { name, description, slug } ) => (
				<>
					<h4>{ name }</h4>
					<p>{ description }</p>
					<Button onClick={ () => activate( slug ) }>Enable</Button>
					<Button onClick={ () => deactivate( slug ) }>Disable</Button>
				</>
			) ) }
		</div>
	)
}
```
