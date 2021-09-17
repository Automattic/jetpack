# useSelectSocialMedia hook

React hook to get relevant data about the social media connections.
This hook should be used together with the [useSocialMediaConnections](../use-social-media-connections) hook.

## API 

This hook returns an object with the following properties.

### connections

The social media connections list.

```es6
import useSocialMediaConnections from './hooks/use-social-media-connection';

function PrintConnections() {
	const { connections } = useSelectSocialMedia();
	const { toggleEnableState } = useSocialMediaConnections();

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

### message

### maxLength
