# usePurchases

Simple React custom hook that provides data about the current site purchases.


```es6
import usePlan from './hooks/use-purchases';

function PlansSection() {
	const purchasesList = usePurchases();
	return (
		<div className="purchases">
			{ purchases.map( purchase => (
				<>
					<h4>{ product_name }</h4>
					<p>{ expiry_message }</p>
				</>
			) ) }
		</div>
	)
}
```
