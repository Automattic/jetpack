# useAIFeature()

React custom hook that provides valuable data about AI requests for the site.

```es6
function UpgradePlan() {
	const { hasFeature, count, refresh } = useAIFeature();
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

# getAIFeature()

Async helper function that performes and returns relevant data about the AI Assistant feature

# AI_Assistant_Initial_State

Constant with the initial state of the AI Assistant feature
