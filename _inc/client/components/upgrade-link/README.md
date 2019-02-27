UpgradeLink
=======

UpgradeLink is a React component that renders a link so user can jump to Calypso and acquire an upgrade through the purchase of a Jetpack plan. The link will open Calypso in a new tab.

The component only needs the source where this link was clicked, for tracking purposes. It will compose the URL and append the source parameter and the site raw URL on its own. If an affiliate link exists, it will be also append to the link.

## Usage

```jsx

import React, { Component } from 'react';
import UpgradeLink from 'components/upgrade-link';

class UpgradeTest extends Component {

	render() {
		return <UpgradeLink source="aag-backups">;
	}
	
}
```

## Props
The following props can be passed to the UpgradeLink component:

### `source`

<table>
	<tr><td>Type</td><td>String</td></tr>
	<tr><td>Required</td><td>Yes</td></tr>
</table>

Pass a string describing the context where this link was found and clicked.

