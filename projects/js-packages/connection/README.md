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

## Adding a connect button

Every connect link tells WordPress.com where it came from (`from`) and where to send the user afterwards. WordPress.com counts connections by `from` and picks its connection screen by it: a standard name gets the unified screen and returns the user straight to the return URL, without the plans page.

- **Name it with `CONNECTION_FROM`.** For a new surface, add its name there first. A standard name is `owner_surface[_detail]` (the product, the screen, and optionally which button on it): lowercase letters, digits and underscores, at most 64 characters, such as `my_jetpack_header`. `isStandardEntryPoint()` checks the format and `isUnifiedConnectionFlow()` whether WordPress.com shows the unified screen; both mirror Calypso's [`entry-points.ts`](https://github.com/Automattic/wp-calypso/blob/99b8d308db6/client/jetpack-connect/entry-points.ts).
- **Pass `getUserConnectionUrl()` an absolute `redirect_url`.** WordPress.com ignores a relative one and shows the plans page instead. `ConnectScreen`, `ConnectButton` and `useConnection()` are the opposite: their `redirectUri` is relative to wp-admin, because the connection REST API prefixes it with the admin URL.
- **Give each surface its own name.** Don't reuse another surface's name to get its screen: every standard name already gets the unified screen, and a shared name merges both surfaces in WordPress.com's counts. The examples in this README use My Jetpack's own names.
- **Never rename a name once it has shipped.** Reports key on it, and older plugin versions keep sending it.

```jsx
import { CONNECTION_FROM, getUserConnectionUrl } from '@automattic/jetpack-connection';

const connectUrl = getUserConnectionUrl( {
	from: CONNECTION_FROM.myJetpackHeader,
	redirect_url: window.location.href,
} );
```

Without `from` or `redirect_url`, `getUserConnectionUrl()` still falls back to `from=my-jetpack` and a return to My Jetpack. That fallback is deprecated, and in development it logs a warning, as does a `from` that `isUnifiedConnectionFlow()` rejects. For a reconnect, pass `reconnectFrom` and `reconnectRedirectUrl` to `useConnectionErrorNotice()` or `<ConnectionError />`.

# Components
## Component `ConnectScreen`
The component implements the connection screen page, and loads the `ConnectButton` component to handle the whole connection flow.

### Properties
- *apiRoot* - string (required), API root URL.
- *apiNonce* - string (required), API Nonce.
- *registrationNonce* - string (required), registration nonce.
- *redirectUri* - string, the page to return the user to after connecting, relative to wp-admin (e.g. `admin.php?page=my-jetpack`).
- *from* - string, the entry-point name from `CONNECTION_FROM` (see [Adding a connect button](#adding-a-connect-button)).
- *title* - string, page title.
- *buttonLabel* - string, the "Connect" button label.
- *statusCallback* - callback to pull connection status from the component.
- *images* - array, images to display on the right side of the connection screen.
- *assetBaseUrl* - string, path to the `/build` directory of the package consumer.
- *autoTrigger* - Whether to initiate the connection process automatically upon rendering the component.

### Usage
```jsx
import { useState, useCallback } from 'react';
import { CONNECTION_FROM, ConnectScreen } from '@automattic/jetpack-connection';

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
	from={ CONNECTION_FROM.myJetpackConnectionScreen }
	redirectUri="admin.php?page=my-jetpack"
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
- *from* - string, the entry-point name from `CONNECTION_FROM` (see [Adding a connect button](#adding-a-connect-button)).
- *redirectUri* - string, the page to return the user to after connecting, relative to wp-admin (e.g. `admin.php?page=my-jetpack`).
- *statusCallback* - callback to pull connection status from the component.
- *connectionStatus* - object, the connection status info.
- *connectionStatusIsFetching* - boolean, whether the connection status is being fetched at the moment.
- *autoTrigger* - Whether to initiate the connection process automatically upon rendering the component.

### Basic Usage
```jsx
import { useCallback } from 'react';
import { CONNECTION_FROM, ConnectButton } from '@automattic/jetpack-connection';

const onUserConnected = useCallback( () => alert( 'User Connected' ) );

<ConnectButton
	apiRoot="https://example.org/wp-json/" 
	apiNonce="12345"
	registrationNonce="54321"
	from={ CONNECTION_FROM.myJetpackConnectionCard }
	redirectUri="admin.php?page=my-jetpack"
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
- *placement* - `ConnectionPlacement`, where on the page the dialog was opened from. Sent as `placement` only when set.

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
- *placement* - `ConnectionPlacement`, where on the page the dialog was opened from. Sent as `placement` only when set.

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
- *trackingPlacement* - `ConnectionPlacement`, where on the page the flow sits. Sent as `placement` only when set.

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

## Safe Mode screen
`IdentityCrisis` is the new Safe Mode (identity crisis) screen. It reads the Safe Mode state and the connected plugins from the connection store, sends no request until the user picks an action (it does record [Safe Mode events](#safe-mode-events) when it is seen and as the user moves through the questions and the guide), and renders nothing outside Safe Mode. It renders no frame of its own: the host supplies the frame. After each action it leaves or reloads the page, unless the host says otherwise.

- An administrator answers "What is {registered address}?" and, for a copy, one follow-up question; each answer shows its consequence once selected, and one button runs the matching action. A site WordPress marks as staging starts at "What should happen to this copy?" with Safe Mode preselected. When the state's `possibleDynamicSiteUrlDetected` is true, a fourth answer, "Another address for this same site", leads to a result that explains the two addresses and offers to stay in Safe Mode.
- An administrator who cannot answer opens a step-by-step guide ("Work it out step by step"). Each step asks about one thing they can check, such as what loads at the registered address. The answers lead to a main-question statement for the admin to confirm, to the two-addresses result, or to a message to send their host or developer, so the guide adds no action of its own. "Stay in Safe Mode for now" is offered at every guide step, and Back works throughout: from the first step it returns to the question the guide was opened from, with its answer still selected. Each answer so far is listed above the question, and links back to the question it answered.
- Once an administrator chose to stay in Safe Mode, a host that still shows the screen, such as the Connectors card, gets a note that Safe Mode is on above the same questions.
- When a fresh connection fails after it disconnected the site, the screen shows only that message and "Try again" under a "Jetpack Connection is disconnected" heading, without the host's actions, since the site is no longer in Safe Mode. It stays that way after a later failure, and after the host unmounts and remounts it, because the connection store records it as `isDisconnected` on the Safe Mode state.
- When the server refuses a fresh connection because the site is no longer in Safe Mode (it was resolved in another tab, say), the screen shows only that message and "Reload" under a "Jetpack Connection is no longer in Safe Mode" heading, again without the host's actions. This wins over the disconnected view, and is recorded in the connection store as `isResolved`.
- A viewer who cannot resolve Safe Mode sees what is paused and that an administrator needs to resolve it.
- The first view lists the connected plugins with the logos in the state's `pluginLogos`, the same ones the Connectors card shows; a plugin without one, or a server that predates the field, gets its name only.
- The copy says "store" instead of "site" when a WooCommerce-family plugin is connected, except where it quotes how WordPress marks the site ("a staging site"), and names Stats and Backups only when a Jetpack-family plugin is. `hasWooPlugin()` and `hasJetpackPlugin()` export those rules, and `toConnectedPlugins()` reads the store's plugin list for them.

Props:
- `context` (required): `notice`, `my-jetpack` or `connectors`. It sets the [events'](#safe-mode-events) `placement`, and their `context` everywhere except on the notice, which sends the admin screen id instead.
- `showHeader`: `false` hides the logo and heading where the host already shows both, as the Connectors card does.
- `onActionSuccess( result )`: `{ action: 'migrate' }` as soon as Migrate succeeds (the screen then shows that the address update started), `{ action: 'start-fresh', connectUrl }`, or `{ action: 'confirm-safe-mode' }`. Defaults to `onIdentityCrisisActionSuccess()`, which opens `connectUrl` after a fresh connection and reloads after staying in Safe Mode. The reload drops `jetpack_idc_clear_confirmation` and `_wpnonce`, which the admin bar's Safe Mode link adds, so it doesn't clear the confirmation again. To change one action, handle it and pass the rest to `onIdentityCrisisActionSuccess()`.
- `redirectUri`: admin path to return to after a fresh connection.
- `from`: a name from `CONNECTION_FROM`, reported to WordPress.com with a fresh connection.
- `hostActions`: actions only that host offers, such as Disconnect, shown to viewers who can resolve Safe Mode. The screen disables native buttons and form controls in it while an action runs.
- `onMigratedDone`: what "Got it, thanks" does after Migrate. Defaults to the same reload.
- `onDismiss`: shows Dismiss to viewers who cannot resolve Safe Mode.

```jsx
import { IdentityCrisis } from '@automattic/jetpack-connection';

<IdentityCrisis
	context="notice"
	redirectUri="admin.php?page=jetpack"
/>
```

### Building blocks
The screen is built from these, which hosts can also use directly. They take all site data as props.

- `useIdentityCrisisActions( { redirectUri, from, context, isDevelopmentSite } )` calls the `migrate`, `start-fresh` and `confirm-safe-mode` endpoints through `@automattic/jetpack-api`, whose root and nonce the connection store sets from the initial state, and records each action's [Safe Mode events](#safe-mode-events). `context` is the screen's `context` prop and `isDevelopmentSite` comes from the Safe Mode state; both are optional, but without `context` the events are sent with a null `context` and no `placement`, and without `isDevelopmentSite` they leave out `is_development_site`. It returns those three actions plus `busyAction`, `isMigrated`, `isDisconnected` (a fresh connection failed after disconnecting the site; it never clears, and is also recorded in the connection store), `isResolved` (a fresh connection was refused because the site is no longer in Safe Mode; it never clears either, and is recorded the same way), `error` (`{ action, cause, code }`, where `code` is the REST error code or the client error's name, for tracking) and `clearError()`, for a host that moves the user to another step after a failure. Each action takes an optional `{ entry, path }` saying how the user reached it, and its events send that `path`; an action called without one sends none. It never navigates: `startFresh()` resolves with the connect URL for the host to open, with `from` (a name from `CONNECTION_FROM`, see [Adding a connect button](#adding-a-connect-button)) already in it, or fails with a `server` error when the response isn't an `http(s)` URL. It and `confirmSafeMode()` stay busy after success, because the host is expected to leave or reload the page, so no button can be clicked in the meantime. While an action is busy, calling any of them sends no request and resolves as a failure (`false`, or `null` from `startFresh()`) without setting `error`, so a double click sends one request even if the host doesn't disable its buttons.
- `IdentityCrisisLayout` holds the logo from `logoUrl` (the connected plugins' marks, from the Safe Mode state; Jetpack's by default) and the "Jetpack Connection is in Safe Mode" heading (or `heading`), its children and a `hostActions` slot for actions only that host offers, which `isBusy` disables. `showHeader={ false }` hides the logo and heading and labels the region instead.
- `IdentityCrisisAddresses` shows the address WordPress.com has on record beside the address the site now loads at (below it where space is short), and renders nothing unless it has both. The address props are optional, like `wpcomHomeUrl` and `currentUrl` in the Safe Mode state, so a host can pass the state straight through. `isStore` says "store" instead of "site".
- `IdentityCrisisMigrated`, `IdentityCrisisNonAdmin` and `IdentityCrisisErrorNotice` are the state after Migrate, the view for users who cannot resolve Safe Mode (with Dismiss when given `onDismiss`), and a failure message that names the cause. Give the notice an `action` to show only that action's failure, such as next to its button.

The text and support link overrides that plugins send through the `jetpack_idc_consumers` filter don't apply: every plugin gets the same wording.

## Tracking connection events
`ProtectedOwnerConfirmation`, `ProtectedOwnerRelease`, `TransferConnectionOwnership` and the transfer link in `DisconnectUserDialog` record Tracks events by default. The `trackingContext` prop (`context` for `DisconnectUserDialog`) is sent as the event's `context` property, or `null` when omitted. `context` names the page; when one page renders the same component in more than one place, `trackingPlacement` (`placement` for the dialogs) names which, and is left out of the event otherwise. Placements are a closed `ConnectionPlacement` type, in `helpers/connection-tracking.ts`: add a new one there before passing it.

Only the page's own entry point sets `context`. A component that can render on more than one page, such as one exported from a package or loaded onto other dashboards through a shared script, takes `context` from its host and never hard-codes it; it may still set its own `placement`. For example, My Jetpack's shared header is told `my-jetpack` or `boost` by the page it renders on. The Safe Mode screen is the exception on the notice: shown across admin pages, it sends the admin screen id as `context` (see [Safe Mode events](#safe-mode-events)).

The package also exports `CONNECTION_EVENTS` (the canonical event names), `trackConnectionEvent( event, context, props )`, `trackIdentityCrisisEvent( event, context, props )` (a Safe Mode event, with the properties every Safe Mode event carries) and `bumpConnectionStat( group, name )` (an MC stat) for hosts that cannot bundle `@automattic/jetpack-analytics`, such as the Connectors card. None of them throws. `bumpConnectionStat` skips the Tracks script, so check that the site allows tracking before calling it.

### Safe Mode events
`IdentityCrisis` records these Tracks events through `trackIdentityCrisisEvent()`; send a host's own Safe Mode events, such as the Connectors card's Disconnect, through it too. Views and action starts keep the old Safe Mode screen's names, so one query counts both screens, split by `screen_version`. Unlike the components above, the screen's events always carry `placement`, set from its required `context` prop.

Every event carries:

| Property | Value |
| --- | --- |
| `screen_version` | `2`. The old screen's events have none. |
| `placement` | `page_notice` for the `notice` context, `page_modal` for `my-jetpack`, `connection_card` for `connectors`. Left out without a `context`. |
| `context` | The `context` prop, except on the notice, which sends the admin screen id (`window.pagenow`, e.g. `dashboard` or `edit-post`), or `notice` when the page has none. |
| `platform` | The old screen's values, from `site.host` in the script data: `woa`, `vip` or `newspack`, and `self-hosted` for any other host. Left out when the page has no `site.host`. Approximate for Newspack sites on Atomic or VIP. |
| `blog_id` | `site.wpcom.blog_id` from the script data, when it is a positive integer. |

| Event | When | Other properties |
| --- | --- | --- |
| `jetpack_idc_notice_view` | Once per mount, the first time the screen is in the viewport while the tab is visible, for a viewer who can resolve Safe Mode. | `is_development_site`, `dynamic_site_url_detected` |
| `jetpack_idc_non_admin_notice_view` | The same, for a viewer who can't. | — |
| `jetpack_idc_migrate`, `jetpack_idc_start_fresh`, `jetpack_idc_confirm_safe_mode` | An action starts, before its request. | `path`, `is_development_site` |
| `jetpack_idc_action_success` | The action's request succeeded. Sent with `use_beacon`, so it survives the page reloading or being left right after. | `action`, `path`, `is_development_site`, `use_beacon`; `new_blog_id` for `start_fresh` |
| `jetpack_idc_action_error` | The action's request failed. | `action`, `path`, `is_development_site`, `error_code`, `error_cause` |
| `jetpack_idc_question_click` | An answer moves the flow on: Next on a question that leads to another step, or an answer in the step-by-step guide. Also Back, and the guide's links back to an earlier answer. A pick without Next sends nothing, and an answer that runs an action ends that action's `path` instead. | `action`, `question`, `answer` (answers only), `path`, `is_development_site` |
| `jetpack_idc_guide_click` | The step-by-step guide is opened, reaches a statement (after that answer's `jetpack_idc_question_click`), or is left by "Stay in Safe Mode for now". | `action`, `question`, `answer` (statements only), `path`, `is_development_site` |
| `jetpack_idc_disconnect_site` | The Connectors card's Disconnect site, after its `safe_mode_disconnect_site` click, has disconnected the site and the admin leaves the dialog. The card sends it, with `use_beacon`, because the page reloads. | `use_beacon` |

- `action`: `migrate`, `start_fresh` or `confirm_safe_mode`, the start events' suffixes; on `jetpack_idc_question_click`, `answer` or `back`; on `jetpack_idc_guide_click`, `open`, `conclusion` or `later`.
- `path`: the answers that led to the action, joined with `>` (e.g. `original>fresh`), from `getPath()`. It starts with `detected_copy` on a staging or development site, which skips the first question (`detected_copy>safe`), and with `guide` after the guide is opened, leaving out the answers given before it (`guide>loads>separate>other_address>original>safe`). On an answer and on `conclusion`, it is the answers so far, ending with the one given. On Back, `open` and `later`, it is the answers that led to the step left, and is left out only on the first question of a site that isn't a staging or development site, before any answer.
- `question`: the step id in `flow/steps.ts`: the one answered, or the one left. A question (`main`, `copy`, `replaced`), a guide question (`open_address`, `was_it_there`, `same_or_separate`, `visitors_use`), or, for Back, a result (`two-addresses`, `ask`, `later`). A statement the guide reached is `main`, with a `path` that starts with `guide`.
- `answer`: the answer's id, as in `path`; on `conclusion`, the statement reached: `old`, `original` or `copyof`.
- `error_code`: the hook's `error.code`; `unknown` when there is none, and `other` when it isn't a plain id of up to 64 letters, digits, `_` and `-`.
- `error_cause`: the hook's `error.cause`: `offline`, `blocked`, `output`, `session`, `permission`, `disconnected`, `resolved` or `server`.
- `new_blog_id`: the blog the site registered as, from the connect URL's `client_id`, when it is a positive integer.

An action called while another is busy records nothing. The screen doesn't identify the viewer to Tracks: its host does, for example with `initializeTracksIdentity()`.

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
