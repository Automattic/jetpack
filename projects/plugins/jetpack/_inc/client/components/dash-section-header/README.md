Dash Section Header
=========

This component is used to display a header for the dash widgets on the At A Glance view.

## Example Usage:

```js
var DashItem = require( 'components/dash-section-header' )

render: function() {
	return (
		<DashSectionHeader
			label="Site Security"
			settingsPath="/security"
			externalLink="Manage Security on WordPress.com"
			externalLinkPath="some/path"/>
	);
}
```
## Dash Section Header
This component combines the elements that make up the section headers in At a Glance and includes an optional settings link and an optional external link.

#### Props
- `label` - (string) Title of the dash item.
- `settingsPath` - *optional* (string) sets the path of the settings icon.
- `externalLink` - *optional* (string) sets the text for the external link.
- `externalLinkPath` - *optional* (string) sets the path of the external link.
