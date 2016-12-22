SettingsCard
=========

This component is used to display a card with header and button to save settings.
Its children are all the form elements used to compose the settings.
Uses isSavingAnyOption and onSubmit defined in components/module-settings/module-settings-form.jsx

#### How to use:

```js
var SettingsCard = require( 'components/settings-card' );

render: function() {
	return (
		<SettingsCard header={ __( 'The card header', { context: 'Settings header' } ) } { ...this.props }>
			<FormFieldset>
				// form elements
			</FormFieldset>
		</SettingsCard>
	);
}
```