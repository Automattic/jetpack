# usePlan

Simple React custom hook that provides data about the current site plan.


```es6
import usePlan from './hooks/use-plan';

function PlansSection() {
	const { name } = usePlan();
	return <h1>{ name ) }</h1>;
}
```
