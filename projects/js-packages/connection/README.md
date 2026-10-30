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

## Component `ConnectionErrorDetails`
What a connection error says, without the chrome that carries it: each error's headline, the scopes it applies to, any link it asks for (e.g. Site Health) and the support link.

Render it wherever a connection error has to be described outside a notice — a status card, a settings panel — so that surface uses the same words `ConnectionErrorNotice` does. It renders nothing when given neither a message nor a group.

### Properties
- *message* - string | element, fallback copy for callers with no derived groups.
- *errorGroups* - array, the groups from `useConnectionErrorNotice`'s `errorGroups`.
- *showSupportLink* - boolean, whether to append the "Contact Jetpack Support" link. Pass the hook's `showSupportLink`.
- *variant* - string, a `@wordpress/ui` `Text` variant for the headlines and support link, for surfaces whose body copy is smaller than a notice's. The scope lines under a headline stay `body-sm` regardless.
- *onNoticeLinkClick* - function, called with the link when a notice-body link (e.g. "Visit Site Health") is clicked, e.g. for tracking.
- *onSupportLinkClick* - function, called when the "Contact Jetpack Support" link is clicked.

### Basic Usage
```jsx
import { ConnectionErrorDetails, useConnectionErrorNotice } from '@automattic/jetpack-connection';

const StatusPanel = () => {
	const { hasConnectionError, errorTitle, errorGroups, showSupportLink } =
		useConnectionErrorNotice();

	if ( ! hasConnectionError ) {
		return null;
	}

	return (
		<>
			<h4>{ errorTitle }</h4>
			<ConnectionErrorDetails errorGroups={ errorGroups } showSupportLink={ showSupportLink } />
		</>
	);
};
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
- *context* - string, the surface recorded with the dialog's analytics events, e.g. `plugins`. Sent as `null` when omitted.
- *placement* - `ConnectionPlacement` (`header`, `connection_card` or `page_notice`), where on the page the dialog was opened from. Sent as `placement` only when set.

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

## Component `DisconnectUserDialog`
The `DisconnectUserDialog` component asks the viewer to confirm before disconnecting their own WordPress.com account, and decides which confirmation that is. It reads the viewer from the package store, so the host does not have to say whether they own the connection: an owner is warned that disconnecting them ends every user's connection and is offered the ownership transfer instead, and everyone else gets a plain confirm.

The unlink itself runs through the store's `unlinkUser` action, which records the result, so surfaces reading connection state from the store reflect it without a page reload.

### Properties
- *apiRoot* - string (required), API root URL.
- *apiNonce* - string (required), API Nonce.
- *isOpen* - boolean, whether the dialog is open. Nothing renders when it is false.
- *onClose* - callback (required), called when the dialog is dismissed without disconnecting.
- *onUnlinked* - callback, called once the account has been disconnected. The dialog does not close itself, so the host decides what closes and whether to reload.
- *onTransferOwnership* - callback, opens the host's ownership transfer flow. Omit it to hide that action from the owner's warning.
- *context* - string, recorded with the dialog's analytics events. Leave it out only if the surface genuinely has no name: there is no default, so an omitted context is sent as `null` rather than attributed to another surface.
- *placement* - `ConnectionPlacement` (`header`, `connection_card` or `page_notice`), where on the page the dialog was opened from. Sent as `placement` only when set.

### Important Notes
The dialog takes no props describing the viewer. It reads `isMaster` and the viewer's capabilities from the store, which `Initial_State` fills, so a host that renders it on a page without that script data will show the non-owner confirmation to everyone.

`Disconnect` is disabled while the site is in offline mode, where WordPress.com cannot be reached to action it, and the dialog cannot be dismissed with ESC or a click outside while a request is in flight.

### Basic Usage
```jsx
import { useState } from 'react';
import { DisconnectUserDialog } from '@automattic/jetpack-connection';

const [ isOpen, setIsOpen ] = useState( false );

<DisconnectUserDialog
	apiRoot={ APIRoot }
	apiNonce={ APINonce }
	isOpen={ isOpen }
	context="my-surface"
	onClose={ () => setIsOpen( false ) }
	onUnlinked={ () => setIsOpen( false ) }
/>
```

## Component `TransferConnectionOwnership`
The `TransferConnectionOwnership` component hands this site's WordPress.com connection to another connected administrator. It walks the user through choosing one, confirming what moves with ownership, and a success message.

It is not a modal and renders no chrome of its own: the surface that hosts it supplies the container, the heading and the way out. That is what lets the same component serve a dialog, a card or a settings panel.

On success it updates the package store with the new owner, so surfaces reading connection state from the store — including `isMaster` — reflect the change without a page reload. A host that passes its own copy of that data down as props, as `ManageConnectionDialog` does with `connectedUser`, only reflects it if that copy comes from the store.

### Properties
- *apiRoot* - string (required), API root URL.
- *apiNonce* - string (required), API Nonce.
- *onTransferred* - callback, called with the new owner's local user ID once WordPress.com has accepted the change. Only needed for logic beyond the store update, such as analytics or closing the surrounding surface.
- *onBusyChange* - callback, called with whether a transfer is in flight, so a host can hold its own exits shut while it runs.
- *trackingContext* - string, the surface to report Tracks events as (`jetpack_connection_owner_transfer_attempt`, `_success` and `_error` with a `reason`). Sent as `context`, or `null` when omitted.
- *trackingPlacement* - `ConnectionPlacement` (`header`, `connection_card` or `page_notice`), where on the page the flow sits. Sent as `placement` only when set.

### Important Notes
The component renders only the controls its own steps need: `Continue`, `Back` between steps, and the transfer itself. Leaving the flow is the host surface's business, so there is no Cancel, Close or Done button — add one in your own chrome if the surface needs it.

If the site has no other connected administrator, the component explains why rather than offering an action that cannot succeed, so a host should not assume a transfer is always possible.

### Basic Usage
```jsx
import { TransferConnectionOwnership } from '@automattic/jetpack-connection';

<TransferConnectionOwnership
	apiRoot={ APIRoot }
	apiNonce={ APINonce }
	onTransferred={ () => setIsPanelOpen( false ) }
/>
```

## Tracking connection events
`ProtectedOwnerConfirmation`, `ProtectedOwnerRelease`, `TransferConnectionOwnership` and the transfer link in `DisconnectUserDialog` record Tracks events by default. The `trackingContext` prop (`context` for `DisconnectUserDialog`) is sent as the event's `context` property, or `null` when omitted. `context` names the page; when one page renders the same component in more than one place, `trackingPlacement` (`placement` for the dialogs) names which, and is left out of the event otherwise. Placements are a closed `ConnectionPlacement` type: add a new one there before passing it.

Only the page's own entry point sets `context`. A component that can render on more than one page, such as one exported from a package or loaded onto other dashboards through a shared script, takes `context` from its host and never hard-codes it; it may still set its own `placement`. For example, My Jetpack's shared header is told `my-jetpack` or `boost` by the page it renders on.

The package also exports `CONNECTION_EVENTS` (the canonical event names) `trackConnectionEvent( event, context, props )` and `bumpConnectionStat( group, name )` (an MC stat) for hosts that cannot bundle `@automattic/jetpack-analytics`, such as the Connectors card. Neither throws. `bumpConnectionStat` skips the Tracks script, so check that the site allows tracking before calling it.

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

The status in the store comes from the page's initial state. Before an action that depends on the current state, such as registering the site, dispatch `refreshConnectionStatus()`: it reads the status from the server, records it in the store and resolves with it.
