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