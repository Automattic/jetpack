Connection Package
=========

The package encapsulates the Connection functionality.

## Initial State

In order to use this package, you must ensure that the Jetpack Connection composer package provides the initial state for the connection components.

In order to do that, make sure to attach the Initial State inline script to your app when you enqueue it.

Example:

```PHP
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
// ...
function my_app_enqueue_script() {
	// ...
	wp_enqueue_script( 'my-app-script' );
	Connection_Initial_State::render_script( 'my-app-script' );
}
```

# Components
## Component `ConnectScreen`
The component implements the connection screen page, and loads the `ConnectButton` component to handle the whole connection flow.

### Properties
- *apiRoot* - string (required), API root URL.
- *apiNonce* - string (required), API Nonce.
- *registrationNonce* - string (required), registration nonce.
- *redirectUrl* - string, wp-admin URI to redirect a user to after Calypso connection flow.
- *from* - string, custom string parameter to identify where the request is coming from.
- *title* - string, page title.
- *buttonLabel* - string, the "Connect" button label.
- *statusCallback* - callback to pull connection status from the component.
- *images* - array, images to display on the right side of the connection screen.
- *assetBaseUrl* - string, path to the `/build` directory of the package consumer.
- *autoTrigger* - Whether to initiate the connection process automatically upon rendering the component.

### Usage
```jsx
import { useState, useCallback } from 'react';
import { ConnectScreen } from '@automattic/jetpack-connection';

const [ connectionStatus, setConnectionStatus ] = useState( {} );

const statusCallback = useCallback(
    status => {
		setConnectionStatus( status );
	},
	[ setConnectionStatus ]
);

<ConnectScreen
	apiRoot="https://example.org/wp-json/" 
	apiNonce="12345"
	registrationNonce="54321"
	from="my-jetpack"
	redirectUri="tools.php?page=wpcom-connection-manager"
	statusCallback={ statusCallback }
>
	<p>The connection screen copy.</p>
</ConnectScreen>
```

## Component `ConnectButton`
The component displays the connection button and handles the connection process, including site registration and user authorization.

### Properties
- *connectLabel* - string, the "Connect" button label.
- *apiRoot* - string (required), API root URL.
- *apiNonce* - string (required), API Nonce.
- *registrationNonce* - string (required), registration nonce.
- *from* - string, custom string parameter to identify where the request is coming from.
- *redirectUrl* - string, wp-admin URI to redirect a user to after Calypso connection flow.
- *statusCallback* - callback to pull connection status from the component.
- *connectionStatus* - object, the connection status info.
- *connectionStatusIsFetching* - boolean, whether the connection status is being fetched at the moment.
- *autoTrigger* - Whether to initiate the connection process automatically upon rendering the component.

### Basic Usage
```jsx
import { useCallback } from 'react';
import { ConnectButton } from '@automattic/jetpack-connection';

const onUserConnected = useCallback( () => alert( 'User Connected' ) );

<ConnectButton
	apiRoot="https://example.org/wp-json/" 
	apiNonce="12345"
	registrationNonce="54321"
	from="my-jetpack"
	redirectUri="tools.php?page=wpcom-connection-manager"
	connectionStatus={ connectionStatus }
	connectionStatusIsFetching={ isFetching }
/>
```

## Component `DisconnectDialog`
The `DisconnectDialog` component displays a 'Disconnect' button that, upon clicking, will open a Dialog that presents the user the option to Disconnect their site.
Upon confirming, both site and user are disconnected and the user is presented with a success message along with a "Return to WordPress" button that closes the dialog.
If an error occurs while trying to disconnect, a custmomizable error message will appear.


### Properties
- *apiRoot* - string (required), API root URL.
- *apiNonce* - string (required), API Nonce.
- *title* - string, the dialog title. Defaults to: "Are you sure you want to disconnect?"
- *onDisconnected* - callback, to be called after the user has been successfully disconnected AND clicks the "Return to WordPress" button.
- *onError* - callback, to be called when an error occurs while disconnecting.
- *errorMessage* - string, error message to display when an error occurs while disconnecting. Defaults to: "Failed to disconnect. Please try again."

### Important Notes
It's important to note that the `onDisconnected` callback will not immediately trigger upon receiving a successful API response. This happens because we want to display a success message to the user first within the `DisconnectDialog`.
If a parent consumer for example, were to update their connection status using this event, the `DisconnectDialog` would be hidden before showing the success message to the user.
Because we made this design decision, and to ensure a non-breaking UX, the `Modal` (see `wordpress/components/modal`) used by the `DisconnectDialog` will not close (as usual) using either ESC key or clicking outside of the Dialog.
This way we ensure that `onDisconnected` will always be called via clicking the "Return to WordPress" button, after successfully disconnecting the site.


### Basic Usage
```jsx
import { useCallback } from 'react';
import { DisconnectDialog } from '@automattic/jetpack-connection';

const onDisconnectedCallback = useCallback( () => alert( 'Successfully Disconnected' ) );

<DisconnectDialog
	apiRoot={ APIRoot }
	apiNonce={ APINonce }
	onDisconnected={ onDisconnectedCallback }
>
	<p>
		{ __( 'Jetpack is currently powering multiple products on your site.',
                'jetpack' ) }
		<br/>
		{ __( 'Once you disconnect Jetpack, these will no longer work.',
                'jetpack' ) }
    </p>
</DisconnectDialog>
```

## Fetching connection status and other data from the store
The package relies on [controls](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#controls-2)
and [resolvers](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#resolvers)
to pull connection status from the API, and put it into the package's Redux store.

Once connection status is added to the store, consuming plugins can rely on it for the single source of truth regarding connection status. 

### Basic Usage

Let's say you have a component that requires connection data.
You could pull that data directly from the REST API, but you'll likely run into the following problems:
- If you're also using the Jetpack Connection components, you'll end up with two separate copies of connection status in two separate stores.
- There'll be two API requests sent to the same endpoint, both retrieving connection status: your app and the Connection package.
- It's just not as convenient. Why handle the data yourself, when you can simply load it from the Jetpack Connection store?

So, we'll use the [`withSelect`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#withselect) higher-order component to pull the data:

```jsx
// Import the `withSelect` HOC.
import { withSelect } from '@wordpress/data';

// Import the Jetpack Connection store ID.
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';

// The component requires the `connectionStatus` parameter.
const SampleComponent = props => {
	const { connectionStatus } = props;
	return <div>{ JSON.stringify( connectionStatus ) }</div>;
}

// We wrap `SampleComponent` into the `withSelect` HOC,
// which will pull the data from the store and pass as a parameter into the component.
// Connection status object doesn't exist at the first render,
// it's pulled from the API using WP Data controls and resolvers.
export default withSelect( select => {
	return {
		connectionStatus: select( CONNECTION_STORE_ID ).getConnectionStatus(),
	}
} )( SampleComponent );
```

# Hooks
## Hook `useConnectionStatusSummary`
Reports the connection's standing for a status surface — a card, a badge, a health row: whether it is broken, which half broke, and how much it is this viewer's problem.

Use it wherever a surface describes the connection in its own words. For the error *message* and its CTAs, use `useConnectionErrorNotice` (or the ready-made `ConnectionError` component) instead — the summary reads the same `scope` and `severity` that hook derives, so surfaces built on either cannot rate the same break differently.

### Returns
- *hasConnectionError* - boolean, whether there is an error worth showing this viewer. Another user's broken token is not one.
- *scope* - `'site'` | `'account'` | `'owner-account'` | `'mixed'`, the half of the connection at fault, or `null` when nothing is broken. `owner-account` means the connection owner's account, and the viewer is not them.
- *severity* - `'error'` | `'warning'`, or `null` when nothing is broken. `warning` marks a break only somebody else can repair, so the viewer is being told rather than asked to act.

The summary carries no copy, so each consumer keeps its own voice and text domain.

The return type is discriminated on `hasConnectionError`: `scope` and `severity` are non-null exactly when it is `true`. TypeScript consumers should hold the summary as an object rather than destructuring it, so that a `hasConnectionError` check narrows the other two.

### Basic Usage
```jsx
import { useConnectionStatusSummary } from '@automattic/jetpack-connection';

const ConnectionBadge = () => {
	const connection = useConnectionStatusSummary();

	if ( ! connection.hasConnectionError ) {
		return <Badge level="success">{ __( 'Connected', 'my-text-domain' ) }</Badge>;
	}

	// `scope` and `severity` are known non-null here.
	return <Badge level={ connection.severity }>{ labelFor( connection.scope ) }</Badge>;
};
```
