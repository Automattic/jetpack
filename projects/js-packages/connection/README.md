Connection Package
=========

The package encapsulates the Connection functionality.

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
import React, { useState, useCallback } from 'react';
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
	from="connection-ui"
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
- *onRegistered* - callback, to be called upon registration success.
- *from* - string, custom string parameter to identify where the request is coming from.
- *redirectUrl* - string, wp-admin URI to redirect a user to after Calypso connection flow.
- *statusCallback* - callback to pull connection status from the component.
- *connectionStatus* - object, the connection status info.
- *connectionStatusIsFetching* - boolean, whether the connection status is being fetched at the moment.
- *autoTrigger* - Whether to initiate the connection process automatically upon rendering the component.

### Basic Usage
```jsx
import React, { useCallback } from 'react';
import { ConnectButton } from '@automattic/jetpack-connection';

const onRegistered = useCallback( () => alert( 'Site registered' ) );
const onUserConnected = useCallback( () => alert( 'User Connected' ) );

<ConnectButton
	apiRoot="https://example.org/wp-json/" 
	apiNonce="12345"
	registrationNonce="54321"
	onRegistered={ onRegistered }
	from="connection-ui"
	redirectUri="tools.php?page=wpcom-connection-manager"
	connectionStatus={ connectionStatus }
	connectionStatusIsFetching={ isFetching }
/>
```

## Component `ConnectUser`
This component encapsulates the user connecting functionality.

Upon the first rendering, it initiates the user connection flow, and either redirects the user to Calypso,
or renders the `InPlaceConnection` component.

### Properties

- *connectUrl* - string, the authorization URL (the no-iframe version). Fetched automatically if omitted.
- *redirectUrl* - string, wp-admin URI to redirect a user to after Calypso connection flow. May be omitted if `connectUrl` is provided.
- *from* - string, indicates where the connection request is coming from.
- *redirectFunc* - function, the redirect function (`window.location.assign()` by default).

## Usage
```jsx
import { ConnectUser } from '@automattic/jetpack-connection';

<ConnectUser
	connectUrl="https://jetpack.wordpress.com/jetpack.authorize/1/"
	redirectUri="tools.php?page=wpcom-connection-manager"
	from="connection-ui"
/>
```

## Component `InPlaceConnection`

__The component is deprecated and will soon be removed.__

It includes:
- the `iframe` HTML element
- connection URL handling
- catching the "close" message and executing the callback
- fallback for not available cookie

### Properties
- *title* - string (required), the iframe title.
- *isLoading* - boolean, whether to display the "Loading..." label in the component, defaults to `false`.
- *width* - string|number, the iframe width, defaults to `100%`.
- *height* - string|number, the iframe height, defaults to `220`.
- *scrollToIframe* - boolean, whether after iframe rendering, window should scroll to its current position. Defaults to `false`.
- *onComplete* - callback, to be executed after connection process has completed.
- *onThirdPartyCookiesBlocked* - callback, to be executed if third-party cookies are blocked.
- *connectUrl* - string (required), the connection URL.
- *displayTOS* - boolean (required), whether the iframe should display TOS or not.
- *location* - string, component location identifier passed to WP.com.

### Usage
```jsx
import { InPlaceConnection } from '@automattic/jetpack-connection';

<InPlaceConnection
	connectUrl="https://jetpack.wordpress.com/jetpack.authorize/1/"
	height="600"
	width="400"
	isLoading={ false }
	title="Sample Connection"
	displayTOS={ false }
	scrollToIframe={ false }
	onComplete={ () => alert( 'Connected' ) }
	onThirdPartyCookiesBlocked={ () => window.location.replace( 'https://example.org/fallback-url/' ) }
	location="sample-connection-form"
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
It's important to note that the `onDisconnected` callback will not immediately trigger upon receiving a successfull API response. This happens because we want to display a success message to the user first within the `DisconnectDialog`.
If a parent consumer for example, were to update their connection status using this event, the `DisconnectDialog` would be hidden before showing the success message to the user.
Because we made this design decision, and to ensure a non-breaking UX, the `Modal` (see `wordpress/components/modal`) used by the `DisconnectDialog` will not close (as usual) using either ESC key or clicking outside of the Dialog.
This way we ensure that `onDisconnected` will always be called via clicking the "Return to WordPress" button, after successfully disconnecting the site.


### Basic Usage
```jsx
import React, { useCallback } from 'react';
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

## Component `ConnectionStatusCard`
The `ConnectionStatusCard` component displays the current site and user connection status as well as the corresponding actions.
This component is meant to be used when at least the site level connection has been established, aka there's a status to display.
In cases where the site level connection has not been established yet, please use the `ConnectScreen` component instead.

It consists of 2 main states: 
1. *User account connected*: In this state the user will be presented with information regarding their connected WordPress.com account, aka the `username` and `avatar`.
2. *User account not connected*: In this state the user will be presented with an alert message informing them their account is not connected and a corresponding button that upon clicking will trigger the User Connection flow.

In all cases, users are presented with a link to `Disconnect` (see `DisconnectDialog` component).


### Properties
- *apiRoot* - string (required), API root URL.
- *apiNonce* - string (required), API Nonce.
- *isRegistered* - boolean (required), Whether a site level connection has already been established. If not, the component will not render.
- *isUserConnected* - boolean (required), Whether the current user has connected their WordPress.com account.
- *redirectUri* - string (required), The redirect admin URI after the user has connected their WordPress.com account.
- *title* - string, The Card title. Defaults to "Connection".
- *connectionInfoText* - string, The text that will be displayed under the title, containing info how to leverage the connection. Defaults to "Leverages the Jetpack Cloud for more features on your side."
- *onDisconnected* - callback, The callback to be called upon disconnection success.

### Important Notes
The `Disconnect` functionality is **temporary**. In the future, it will be replaced with a link to a central connection management page from where users will be able to disconnect.


### Basic Usage
```jsx
import React, { useCallback } from 'react';
import { ConnectionStatusCard } from '@automattic/jetpack-connection';

const onDisconnectedCallback = useCallback( () => alert( 'Successfully Disconnected' ) );

<ConnectionStatusCard
	apiRoot={ APIRoot }
	apiNonce={ APINonce }
	isRegistered={ true }
	isUserConnected={ true }
	redirectUri="tools.php?page=wpcom-connection-manager"
/>
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

### Reusing Connection Status 

When the connection screen is loaded for the first time, it queries the API to load the current connection status.
This request is often excessive, as the plugin can provide connection status from its own initial state.
This will save one API request, so the connection screen will load a bit faster (significantly faster on slow connections). 

To do that, you need to supply the RNA Connection package store with the data as early in the process as possible,
before it requests the data from the API.

Here's an example of how to do that:

```jsx
import { withDispatch } from '@wordpress/data';
import { ConnectScreen, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';

const PluginDashboard = props => {
	props.setConnectionStatus( props.connectionStatusFromInitialState );
};

export default withDispatch( dispatch => {
	return {
		setConnectionStatus: connectionStatus => {
		    // Informing the store that we're starting the data resolution process (so it wouldn't send the API request).
			dispatch( CONNECTION_STORE_ID ).startResolution( 'getConnectionStatus', [] );
			
			// Supplying the data to the store.
			dispatch( CONNECTION_STORE_ID ).setConnectionStatus( connectionStatus );
			
			// Informing the store that resolving is complete, so it no longer needs to send that API request.
			dispatch( CONNECTION_STORE_ID ).finishResolution( 'getConnectionStatus', [] );
		},
	};
} )
```
