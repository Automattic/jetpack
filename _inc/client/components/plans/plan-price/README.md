PlanPrice Component
=============

PlanPrice component is a React component used to display plan's price with a currency and a discount, if any.
It can be used anywhere where a plan's price is required.

If you want to emphasize that a plan's price is discounted, use two `<PlanPrice>` components as below and wrap them in a
flexbox container.

If you pass an array of two numbers in the `rawPrice` prop, a range of prices will be displayed.

Note that a zero-value price is allowed.

## Usage

```jsx
import PlanPrice from 'components/plans/plan-price';

export default class extends React.Component {
	static displayName = 'MyPlanPrice';

	render() {
		return (
			<div>
				<span className="my-plan-price-with-flexbox">
					<PlanPrice rawPrice={ 99 } original />
					<PlanPrice rawPrice={ 30 } discounted />
				</span>
				<span className="my-plan-price-with-flexbox">
					<PlanPrice rawPrice={ [ 132.2, 110.4 ] } original />
					<PlanPrice rawPrice={ [ 99.99, 87 ] } discounted />
				</span>
			</div>
		);
	}
}
```

## Props

| Prop         | Type           | Description                                               |
| ----         | -------        | -----------                                               |
| className    | string         | If you need to add additional classes                     |
| currencyCode | string         | Currency of the price (default: `USD`)                    |
| discounted   | bool           | Is the price discounted and this is the discounted one?   |
| inline       | bool           | When set, a `span` will be returned instead of a `div`    |
| original     | bool           | Is the price discounted and this is the original one?     |
| rawPrice     | number / array | Price or price range of the plan                          |
