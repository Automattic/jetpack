# useSocialMediaConnections hook

React hook to deal with the social media connections.

## API 

This hooks returns an array with useful helpers.

### toggleEnableState()

Enable/disable the state of the social media connection, according to the given connection ID.

```es6
import useSocialMediaConnections from './hooks/use-social-media-connection';

function ToggleConnectionControl() {
	const { toggleEnableState } = useSocialMediaConnections();
	const id = 'my-connection-id';

	return (
		<Button onClick={ toggleEnableState( id ) }>
			Enable/Disable social media connection
		</Button>
	);
}
```
