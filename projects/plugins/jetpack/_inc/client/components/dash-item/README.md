Dash Item
=========

This component is used to display a widget on the At A Glance view. It includes a Section Header with the ability to show the status and a Card.

## Example Usage:

```js
var DashItem = require( 'components/dashitem' )

render: function() {
	return (
		<DashItem label="Protect" status="is-success">
			Jetpack is actively blocking malicious login attempts.
		</DashItem>
	);
}
```
## Dash Item
This is the base component and acts as a wrapper for an At A Glance item's title and content. The title and status are displayed within a SectionHeader and the rest of the content is displayed within a Card.

#### Props
- `label` - *optional* (string) Title of the dash item.
- `status` - *optional* (string) Sets the status colors and icons of the item. Available arguments are `is-success`, `is-warning`, `is-error`, and `is-info`.
- `noToggle` - *optional* (bool) If `true`, the component will not disable the enable/disable toggle.
