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
