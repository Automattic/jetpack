SettingsCard
=========

This component is used to display a card with header, button to save settings and help link.
Its children are all the form elements used to compose the settings.
Uses isSavingAnyOption and onSubmit defined in components/module-settings/module-settings-form.jsx

#### Usage

```js
var SettingsCard = require( 'components/settings-card' );

render: function() {
	return (
		<SettingsCard { ...this.props } header={ __( 'The card header', { context: 'Settings header' } ) }>
			<FormFieldset>
				// form elements
			</FormFieldset>
		</SettingsCard>
	);
}
```

#### Properties

* `module` - A Jetpack module. If it's not present, the `header` and `support` attributes must be explicitly passed if it's intended to display them.
* `header` — The title of the card. If it's not present but `module` attribute is, it will fetch the module and use its name property as title.
* `hideButton` - When this attribute is present, the saving button will not be rendered:
```js
<SettingsCard { ...this.props } header={ __( 'The card header', { context: 'Settings header' } ) } hideButton>
	// form elements
</SettingsCard>
```
* `support` - A custom URL to a support resource. Will be used to render an icon linked to the URL. If no URL is passed but `module` is present, it will fetch the module and use its learn_more_button property as URL.
```js
<SettingsCard { ...this.props } header={ __( 'The card header', { context: 'Settings header' } ) } help="https://jetpack.com/support/sso">
	// form elements
</SettingsCard>
```