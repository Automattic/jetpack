# usePurchases

Simple React custom hook that provides data about the current site purchases.


```es6
import usePlan from './hooks/use-purchases';

function PlansSection() {
	const { name } = usePurchases();
	return <h1>{ name ) }</h1>;
}
```
