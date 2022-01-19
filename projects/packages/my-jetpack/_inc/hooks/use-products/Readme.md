# useProducts

Simple React custom hook that provides data and helpers to deal with site products.

## API

```es6
const { list: productsList, enable, disable } = useProducts();
```

The `useProducts()` hooks returns an object with the following properties:

### list

An array with the products list.

### enable( <slug> )
A helper function to enable a product.

### disnable( <slug> )
A helper function to disable a product.

```es6
import usePlan from './hooks/use-products';

function PlansSection() {
	const { list: productsList, enable, disable } = useProducts();

	return (
		<div className="products">
			{ productsList.map( ( { name, description, slug } ) => (
				<>
					<h4>{ name }</h4>
					<p>{ description }</p>
					<Button onClick={ () => enable( slug ) }>Enable</Button>
					<Button onClick={ () => disable( slug ) }>Disable</Button>
				</>
			) ) }
		</div>
	)
}
```
