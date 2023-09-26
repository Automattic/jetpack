# useAIFeature

The useAIFeature custom hook facilitates the retrieval of AI assistant feature properties, providing an interface for understanding the AI feature's availability, request limits, and any associated errors or upgrade requirements.

```jsx
function UpgradePlan() {
	const { hasFeature, count, refresh } = useAIFeature();

	if ( ! hasFeature ) {
		return (
			<Button>Upgrade</Button>
		);
	}

	return (
		<div>
			<p>
				You have made ${ count } requests so far.
			</p>
			<Button onClick={ refresh }>Refresh data</Button>
		</div>
	);
}
```

### Options

`refreshData`: (optional) A boolean value. When set to true, it fetches the AI features' data afresh from the API. Default is `False`.


## getAIFeature()

Async helper function that performes and returns relevant data about the AI Assistant feature.

## External Data

The hook retrieves initial data from the `window.Jetpack_Editor_Initial_State['ai-assistant']`. This is particularly helpful in cases where you want to initialize your React components with data that's already available on the page load.

## API Interaction

This hook interacts with the `/wpcom/v2/jetpack-ai/ai-assistant-feature` endpoint to fetch the properties of the AI feature.
