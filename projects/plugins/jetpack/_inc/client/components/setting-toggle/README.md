Setting Toggle
=========

This component is used to implement toggle switches of specific settings.

#### How to use:

```js

var SettingToggle = require( 'components/setting-toggle' );

render() {
	return (
		<div className="you-rock">
		<SettingToggle
						slug="setting_name"
						activated="setting_name"
						toggleSetting={ toggleSetting }
						disabled={ isFetchingSettingsList }
					>The setting description.</SettingToggle>
		</div>
	);
}
```

#### Props

* `activated`: (bool) the current activation status of the setting.
* `slug`: (string) the setting name.
* `disabled`: (bool) whether the toggle should be in the disabled state.
* `toggleSetting`: (callback) what should be executed once the user clicks the toggle.