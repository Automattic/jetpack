# Social Media hooks

React hooks to get relevant data about the social media.
This hooks should be used together with the [useSocialMediaConnections](../use-social-media-actions) hook.

## useSocialMediaConnections

The social media connections list.

```es6
import { useSocialMediaConnections } from './hooks/use-social-media-actions';

function PrintConnections() {
	const connections = useSocialMediaConnections();
	const { toggleEnableState } = useSocialMediaActions();

	return (
		<div>
			{ connections.map( ( { display_name, enabled, id, service_name, toggleable } ) => (
				<Button
					disabled={ ! toggleable }
					enabled={ enabled }
					key={ id }
					label={ display_name }
					name={ service_name }
					onClick={ toggleEnableState }
				/>
			) ) }
		</div>
	);
}
```

## useSelectSocialMediaMessage

## useSelectSocialMediaMessageMaxLength

