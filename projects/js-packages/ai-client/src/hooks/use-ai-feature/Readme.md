# useAiFeature()

React custom hook that provides valuable data about AI requests for the site.

```es6
function UpgradePlan() {
	const { hasFeature, count, refresh } = useAiFeature();
	if ( ! hasFeature ) {
		return null;
	}

	return (
		<div>
			{ `You have made ${ count } requests so far.` }
			<Button>Upgrade</Button>
			<Button onClick={ refresh}>Refresh Data!</Button>
		</div>
	);
}
```