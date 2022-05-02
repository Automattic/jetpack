# `useAnalyticsTracks`

React custom hook to handle tracks events.

## Example

```jsx
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';

function MyJetpackAdminApp( init ) {
	/*
	 * Get recordEvent helper,
	 * and record page-view on the fly.
	 */
	const { recordEvent } = useAnalyticsTracks( { pageViewEventName: 'my_admin_app' } );

	if ( init ) {
		// Record generic event.
		recordEvent( 'jetpack_app_init', { dev: 'env', type: 'testing' } )
	}

	return (
		// ...
	);
}
```
# API

## Input Object Properties

### `pageViewEventName`

-   Type: `String`

When defined, it will record a **page-view** event. See [Recording a Page View event](#recording-a-page-view-event) section for more info.

### `pageViewNamespace`

-   Type: `String`
-   Optional
-   Default: `jetpack`

Prefix of the whole name of the **page-view** event. You may like to define a different prefix when recording events in other apps, contexts, etc. For instance, `calypso`, `woocommerce`, etc

### `pageViewSuffix`

-   Type: `String`
-   Optional
-   Default: `page_view`

Suffix of the whole name of the **page-view** event. **We strongly do not recommend changing it** unless the you really consider need to do.

### `pageViewEventProperties`

-   Type: `object`
-   Optional

Optional properties to add to the **page-view** event.

## Return Object Properties

### `recordEvent( eventName, [props] )`

-   Type: `Function`

Helper function to record an event with optional properties. It accepts two arguments:

- `eventName`: The whole name of the event to record. Type: `String`
- `props`: Optional properties to add to the event. Type: `Object`

```jsx
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';

function MyJetpackAdminApp( init ) {
	const { recordEvent } = useAnalyticsTracks();

	if ( init ) {
		recordEvent( 'jetpack_app_init', { dev: 'env', type: 'testing' } )
	}

	return (
		// ...
	);
}
```

`recordEvent()` is an async function which allows optionally to chain, and thus running, a function to it.

```jsx
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';

function MyJetpackAdminApp( init, onContinueHere ) {
	const { recordEvent } = useAnalyticsTracks();

	if ( init ) {
		recordEvent( 'jetpack_app_init' ).then( onContinueHere );
	}

	return (
		// ...
	);
}
```

### `recordEventHandler( eventName, [props], [callback] )`

-   Type: `Function`

`recordEventHandler()` is a helper that returns a function that can be used to record the event defined by `eventName` and, optionally, with the `props` object.

- `eventName`: The whole name of the event to record. Type: `String`
- `props`: Optional properties to add to the event. Type: `Object`
- `callback`: Function callback to run when recording the event.

This function tries to simplify the usage of tracking event tied to events in React components context. The following example shows how to use it when user clicks on a button.

```jsx
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';

function MyJetpackAdminApp( init, onContinueHere ) {
	const { recordEvent } = useAnalyticsTracks();

	const addProduct = recordEventHandler(
		'jetpack_product_add_click',
		onContinueHere
	);

	return (
		<Button onClick={ addProduct }>Get the product!</Button>
	);
}
```

## Recording a Page-View event
Recording a **page-view** event is something so usual that deserves a simple and automatic usage.
Taking advantage of the React hooks, it's makse sense to induce that it happens when the component is mounted.
Also, and by convention to get even simpler, a **page-view** event has the following shape:

`{ pageViewNamespace }_{ eventName }_{ suffix }`, where the values of `pageViewNamespace` is `jetpack` and `suffix` is `page_view` by default.
The idea behing this name convention is to be consistent among all page-view event recorded by different apps, contexts, etc.

Being said that, it's possible to record the **page-view** event simply defining the event name via the [pageViewEventName](#pagevieweventname-optional) of the hook settings:

```jsx
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';

function MyJetpackAdminApp() {
	// the following code will record the `jetpack_my_admin_app_page_view` event
	useAnalyticsTracks( {
		pageViewEventName: 'my_admin_app'
	} );

	return <div>Hello, tracking world!</div>;
}
```