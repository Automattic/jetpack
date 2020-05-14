# FeatureToggle

FeatureToggle is used to provide a simple on/off toggle UI with upgrade options for any feature provided by Jetpack.

If an upgradeLink is provided as a prop then the FeatureToggle will not provide toggle abilities and will instead use the toggle to open the upgrade link.

#### How to use:

```js
import { FeatureButton } from 'components/button';

const render = function() {
	return <FeatureToggle title="Feature" details="Here's some details" checked={ true } />;
};
```

#### Props

- `title` - (string) The title of the feature.
- `details` - (string) The detail sentence to display for the feature.
- `checked` - (bool) True to show the toggle as checked, false to show the toggle as unchecked.
- `info` - _optional_ (string) Optional info about the feature.
- `onToggleChange` - _optional_ (func) Function that will be executed when the toggle is clicked and upgradeLink is not set. It will be passed the current checked value of checked.
- `configureLink` - _optional_ (string) Set as a URL to have the component display a "Configure" button that will open the given URL.
- `upgradeLink` - _optional_ (string) Set as a URL to have the component display a "Upgrade" button that will open the given URL.
- `optionsLink` - _optional_ (string) Set as a URL to have the component display a "View options" hyperlink that will open the given URL.
- `isPaid` - _optional_ (bool) Set to true to visually indicate that the feature is paid.
- `isDisabled` - _optional_ (bool) Set to true to disable the toggle.
