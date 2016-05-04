Settings
=========

This component is a stateless container that wraps several controls used to set miscellaneous settings like Holiday Snow.

#### How to use:

```js
var Settings = require( 'components/settings' );

render: function() {
	return (
		<div className="misc-settings">
		  <Settings />
		</div>
	);
}
```

#### Internal components
```
<SettingToggle
				slug="jetpack_holiday_snow_enabled"
				activated={ isSettingActivated( 'jetpack_holiday_snow_enabled' ) }
				toggleSetting={ toggleSetting }
			/>
```
