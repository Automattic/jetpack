# usePublicizeConfig() hook
Simple hook to get config data about the Publicize feature.

```es6
import usePublicizeConfig from '../../hooks/use-publicize-config';

function SavingPostLabel() {
	const { isRePublicizeFeatureEnabled } = usePublicizeConfig();

	if ( ! isRePublicizeFeatureEnabled ) {
		return null;
	}

	return (
		<div>Welcome to the awesome RePublicize feature</div>
	)
}
```

The hook returns an object with the following props

## isRePublicizeFeatureEnabled
Feature flag, used to hide the new features behind it.

## isPublicizeEnabled
Boolean state used to define whether the feature is enabled, or not.
This state is tied to the main Sharing toggle control.

## togglePublicizeFeature()
Action to enable/disable the sharing feature state. Usually, used together with isPublicizeEnabled state.