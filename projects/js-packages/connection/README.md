Connection Package
=========

The package encapsulates the Connection functionality.

## Component `Main`
Contains the whole connection flow, including site registration and user authorization.

### Properties
- *authorizationUrl* - string, the authorization URL.
- *connectLabel* - string, the "Connect" button label.
- *inPlaceTitle* - string, the title for the In-Place Connection component.
- *forceCalypsoFlow* - boolean, whether to go straight to Calypso flow, skipping the In-Place flow.
- *apiRoot* - string (required), API root URL.
- *apiNonce* - string (required), API Nonce.
- *registrationNonce* - string (required), registration nonce.
- *isRegistered* - boolean, whether the site is registered (has blog token).
- *isUserConnected* - boolean, whether the current user is connected (has user token).
- *hasConnectedOwner* - boolean, whether the site has connection owner.
- *onRegistered* - callback, to be called upon registration success.
- *onUserConnected* - callback, to be called when the connection is fully established.
- *redirectFunc* - callback, the redirect function (`window.location.assign()` by default).
- *from* - string, custom string parameter to identify where the request is coming from.
- *redirectUrl* - string, wp-admin URI so the user to get redirected there after Calypso connection flow.

### Usage
```jsx
import React, { useCallback } from 'react';
import { JetpackConnection } from '@automattic/jetpack-connection';

const onRegistered = useCallback( () => alert( 'Site registered' ) );
const onUserConnected = useCallback( () => alert( 'User Connected' ) );

<JetpackConnection
	apiRoot="https://example.org/wp-json/" 
	apiNonce="12345"
	registrationNonce="54321"
	authorizationUrl="https://jetpack.wordpress.com/jetpack.authorize/1/?..."
	isRegistered={ false }
	isUserConnected={ false }
	hasConnectedOwner={ false }
	forceCalypsoFlow={ false }
	onRegistered={ onRegistered }
	onUserConnected={ onUserConnected }
	from="connection-ui"
	redirectUri="tools.php?page=wpcom-connection-manager"
/>
```

## Component `InPlaceConnection`
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
import InPlaceConnection from 'in-place-connection';

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
