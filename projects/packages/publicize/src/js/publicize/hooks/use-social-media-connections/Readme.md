# useSocialMediaConnections() hook

React hook to deal with the social media connections.

### toggleById( <id> )

Enable/disable the state of the social media connection, according to the given connection ID.

```es6
import useSocialMediaConnections from './hooks/use-social-media-actions';

function ToggleConnectionControl() {
	const { toggleById } = useSocialMediaConnections();
	const id = 'my-connection-id';

	return (
		<Button onClick={ toggleById( id ) }>
			Enable/Disable social media connection
		</Button>
	);
}
```

### connections

The connections list for the site.

### skippedConnections

The connections list, disabled by the user.

### hasConnections

Boolean value that is True when there are available connections. Otherwise, False.

### refresh()

This method will refresh and save the current post in order to propagate the metadata where the connections store.

```es6
import { Button } from '@wordpress/components';
import useSocialMediaConnections from './hooks/use-social-media-connection';

function SocialMediaTextarea() {
	const { refresh } = useSocialMediaConnection();

	return (
		<Button
			value={ message }
			onClick={ refresh }
		>
			Click on it to update the social media connections.
		</Button>
	);
}
```
