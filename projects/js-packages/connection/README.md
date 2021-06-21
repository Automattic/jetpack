Connection Package
=========

The package encapsulates the Connection functionality.

## Component `Main`
Contains the whole connection flow, including site registration and user authorization.

### Properties
- *connectLabel* - string, the "Connect" button label.
- *apiRoot* - string (required), API root URL.
- *apiNonce* - string (required), API Nonce.
- *registrationNonce* - string (required), registration nonce.
- *onRegistered* - callback, to be called upon registration success.
- *from* - string, custom string parameter to identify where the request is coming from.
- *redirectUrl* - string, wp-admin URI to redirect a user to after Calypso connection flow.

### Basic Usage
```jsx
import React, { useCallback } from 'react';
import { JetpackConnection } from '@automattic/jetpack-connection';

const onRegistered = useCallback( () => alert( 'Site registered' ) );
const onUserConnected = useCallback( () => alert( 'User Connected' ) );

<JetpackConnection
	apiRoot="https://example.org/wp-json/" 
	apiNonce="12345"
	registrationNonce="54321"
	onRegistered={ onRegistered }
	from="connection-ui"
	redirectUri="tools.php?page=wpcom-connection-manager"
/>
```

### Advanced Connection Status Handling

You can use the component to keep the connection status updated in your application,
or display custom output inside the component (including connection status).

To do that, you should pass a custom callback function into the `JetpackConnection` component:

```jsx
import React, { useState } from 'react';
import { JetpackConnection } from '@automattic/jetpack-connection';

const [ connectionStatus, setConnectionStatus ] = useState( {} );

<JetpackConnection
	apiRoot="https://example.org/wp-json/" 
	apiNonce="12345"
	registrationNonce="54321"
	from="connection-ui"
	redirectUri="tools.php?page=wpcom-connection-manager"
>
	{ status => {
		setConnectionStatus( status );
		
		return <div className="connection-status-card">
			{ status.isRegistered && ! status.isUserConnected && (
					<strong>Site Registered</strong>
			) }
			{ status.isRegistered && status.isUserConnected && (
					<strong>Site and User Connected</strong>
			) }
		</div>;
	} }
</JetpackConnection>
```

## Component `ConnectUser`
This component encapsulates the user connecting functionality.

Upon the first rendering, it initiates the user connection flow, and either redirects the user to Calypso,
or renders the `InPlaceConnection` component.

### Properties

- *connectUrl* - string (required), the authorization URL (the no-iframe version, will be adjusted for In-Place flow automatically).
- *redirectUrl* - string, wp-admin URI to redirect a user to after Calypso connection flow.
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

## Helper `thirdPartyCookiesFallback`
The helper encapsulates the redirect to the fallback URL you provide.

### Parameters
- *fallbackURL* - string (required), the URL to be redirected to (usually WP.com "authorize" URL)

### Usage
```jsx
import InPlaceConnection from 'in-place-connection';
import { thirdPartyCookiesFallbackHelper } from '@automattic/jetpack-connection/helpers';

<InPlaceConnection
	onThirdPartyCookiesBlocked={ () => thirdPartyCookiesFallbackHelper( 'https://example.org/fallback-url/' ) }
	// Other properties.
/>
```
