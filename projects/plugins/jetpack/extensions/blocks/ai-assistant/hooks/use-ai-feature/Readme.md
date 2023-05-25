# useAIFeature

React custom hook that provides valuable data about AI requests for the site.

```es6
function UpgradePlan() {
	const { hasFeature, count } = useAIFeature();
	if ( ! hasFeature ) {
		return null;
	}

	return (
		<div>
			{ `Your has made ${ count } requests so far.` }
			<Button>Upgrade</Button>
		</div>
	);
}
```
