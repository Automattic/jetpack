# useSocialMediaConnections hook

React hook to deal with the social media connections actions.
You'd like to use together with the [useSelectSocialMedia](../use-select-social-media) selector hook.

## API 

This hooks returns an array with useful helpers.

### toggleEnableState( <id> )

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

### updateMessage( <message> )

Helpder function to update the message to share in the social media.

```es6
import { TextareaControl } from '@wordpress/components';
import useSocialMediaConnections from './hooks/use-social-media-connection';

function SocialMediaTextarea() {
	const { message } = useSelectSocialMedia();
	const { updateMessage } = useSocialMediaConnections();

	return (
		<TextareaControl
			value={ message }
			onChange={ updateMessage }
			placeholder={ __( 'Write a message for your audience here.', 'jetpack' ) }
		/>
	);
}
```
