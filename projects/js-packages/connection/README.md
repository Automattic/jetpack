Connection Package
=========

The component encapsulates the Connection functionality.

## Component InPlaceConnection
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
- *source* - string, component location identifier passed to WP.com.

### Usage
```jsx
import InPlaceConnection from 'in-place-connection';

<InPlaceConnection
	connectUrl={ this.props.connectUrl }
	height={ this.props.height }
	width={ this.props.width}
	isLoading={ this.props.fetchingConnectUrl }
	title={ this.props.title }
	hasConnectedOwner={ this.props.hasConnectedOwner }
	scrollToIframe={ this.props.scrollToIframe }
	onComplete={ this.onComplete }
	onThirdPartyCookiesBlocked={ this.onThirdPartyCookiesBlocked }
	source="connect-user-bar"
/>
```
