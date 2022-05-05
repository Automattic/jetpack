# useSocialMediaMessage() hook

React hooks to deal with social media message.
It allows getting data such as the message or the max length of it, as well as a helper to update the message.

```es6
import { TextareaControl } from '@wordpress/components';
import useSocialMediaConnections from './hooks/use-social-media-actions';

function SocialMediaTextarea() {
	const { message, updateMessage } = useSocialMediaMessage();
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
