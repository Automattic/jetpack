# usePublicizeConfig() hook
Hook to get config data about the Publicize feature.

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

## isRePublicizeFeatureEnabled
Feature flag, used to hide the new features behind it.

## isPublicizeEnabled
Boolean state used to define whether the feature is enabled, or not.
This state is tied to the main Sharing toggle control.

## togglePublicizeFeature()
Action to enable/disable the sharing feature state. Usually, used together with isPublicizeEnabled state.

## Disclaimer

The data consumed by this hook doesn't change their state, at least so far. And considering the idea behind using a hook is to deal with when the data change externally to the component, we might consider that using a hook isn't the best option here.

However, we decided to keep using the hook for the reason we consider, and also being optimistic in this sense, that the Jetpack plans data should be handled by a store. In that case, the hook will fit properly.
Finally, we don't see any big problem handing the data via the hook either. 
