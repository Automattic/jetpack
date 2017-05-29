SettingsGroup
=========

This component is used to display a group of settings along with an optional help link.
Its children are all the form elements used to compose the settings.

#### Usage

```js
var SettingsGroup = require( 'components/settings-group' );

render: function() {
	return (
		<SettingsGroup hasChild module={ this.props.getModule( 'related-posts' ) }>
			<FormFieldset>
				// form elements
			</FormFieldset>
		</SettingsGroup>
	);
}
```

#### Properties

* `hasChild` - Whether this group has a toggle with child settings. A fieldset or a .jp-form-setting-explanation inside will be indented.
* `support` - A custom URL to a support resource. Will be used to render an icon linked to the URL. If no URL is passed but `module` is present, it will fetch the module and use its learn_more_button property as URL.
```js
<SettingsGroup support="https://jetpack.com/support/sso">
	// form elements
</SettingsGroup>
```
* `supportLabel` - A custom label for the link to be shown in the info popover. If it's not passed, the generic text "Learn more about X" is used where X
is a module name.
```js
<SettingsGroup
	module={ photon }
    supportLabel={ __( 'Learn about speeding up images' ) }
	>
	// form elements
</SettingsGroup>
```
* `disableInDevMode` - Whether this group will be disabled in Dev Mode.
```js
<SettingsGroup
	module={ photon }
	disableInDevMode
	>
	// form elements
</SettingsGroup>
```