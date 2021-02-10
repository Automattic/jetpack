In-Place Connection Component
=========

The component encapsulates the In-Place Connection functionality.
It includes:
- the `iframe` HTML element 
- connection URL handling
- catching the "close" message and executing the callback
- fallback for not available cookie 

## Properties
- *title* - string (required), the iframe title.
- *isLoading* - boolean, whether to display the "Loading..." label in the component, defaults to `false`.
- *width* - string|number, the iframe width, defaults to `100%`.
- *height* - string|number, the iframe height, defaults to `220`.
- *scrollToIframe* - boolean, whether after iframe rendering, window should scroll to its current position. Defaults to `true`.
- *onComplete* - callback, to be executed after connection process has completed.
- *connectUrl* - string (required), the connection URL.
- *hasConnectedOwner* - boolean (required), whether the site has a connected owner or not.

## Usage
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
/>
```
