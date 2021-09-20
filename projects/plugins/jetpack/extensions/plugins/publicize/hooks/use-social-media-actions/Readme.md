# useSocialMediaActions hook

React hook to deal with the social media.
This hook should be used together with the [useSelectSocialMedia](../use-select-social-media) selector hook.

## API 

This hook returns an array with useful helpers.

### toggleEnableState( <id> )

Enable/disable the state of the social media connection, according to the given connection ID.

```es6
import useSocialMediaActions from './hooks/use-social-media-actions';

function ToggleConnectionControl() {
	const { toggleEnableState } = useSocialMediaActions();
	const id = 'my-connection-id';

	return (
		<Button onClick={ toggleEnableState( id ) }>
			Enable/Disable social media connection
		</Button>
	);
}
```

### updateMessage( <message> )

Helper function to update the message to share in the social media.

```es6
import { TextareaControl } from '@wordpress/components';
import useSocialMediaActions from './hooks/use-social-media-actions';

function SocialMediaTextarea() {
	const { message } = useSelectSocialMedia();
	const { updateMessage } = useSocialMediaActions();

	return (
		<TextareaControl
			value={ message }
			onChange={ updateMessage }
			placeholder={ __( 'Write a message for your audience here.', 'jetpack' ) }
		/>
	);
}
```
