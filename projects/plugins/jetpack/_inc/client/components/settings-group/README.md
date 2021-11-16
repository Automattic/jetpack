SettingsGroup
=========

This component is used to display a group of settings along with an optional help link.
Its children are all the form elements used to compose the settings.

#### Usage

```js
var SettingsGroup = require( 'components/settings-group' );

render: function() {
	return (
		<SettingsGroup
			hasChild
			support={
				text: 'A short explanation about the feature.',
				link: 'https://jetpack.com/support/feature-doc',
			}
			>
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