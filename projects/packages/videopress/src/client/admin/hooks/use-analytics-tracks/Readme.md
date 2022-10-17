# `useAnalyticsTracks`

React custom hook to handle tracks events.

## Example

```jsx
import useAnalyticsTracks from './use-analytics-tracks';

function MyAdminApp( init ) {
	/*
	 * Get the recordEvent helper,
	 * registering the page-view record on the fly.
	 */
	const { recordEvent } = useAnalyticsTracks( { pageViewEventName: 'my_section' } );

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
-   Default: `jetpack-videopress`

The prefix of the whole name of the **page-view** event. You may like to define a different prefix when recording events in other apps, contexts, etc. For instance, `calypso`, `woocommerce`, etc

### `pageViewSuffix`

-   Type: `String`
-   Optional
-   Default: `page_view`

The suffix of the whole name of the **page-view** event. **We strongly do not recommend changing it** unless you really consider the need to do.

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
import useAnalyticsTracks from './hooks/use-analytics-tracks';

function MyAdminApp( init ) {
	const { recordEvent } = useAnalyticsTracks();

	if ( init ) {
		recordEvent( 'jetpack_app_init', { dev: 'env', type: 'testing' } )
	}

	return (
		// ...
	);
}
```

`recordEvent()` is an async function that allows optionally to chain, and thus run, a function to it.

```jsx
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';

function MyAdminApp( init, onContinueHere ) {
	const { recordEvent } = useAnalyticsTracks();

	if ( init ) {
		recordEvent( 'jetpack_app_init' ).then( () => {
			// let's continue here.
		}) );
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
import useAnalyticsTracks from './hooks/use-analytics-tracks';

function MyAdminApp() {
	const { recordEventHandler } = useAnalyticsTracks();

	const onButtonClickHandler = recordEventHandler(
		'jetpack_videopress_button_click',
		function() {
			// Continue here...
		}
	);

	return (
		<Button onClick={ onButtonClickHandler }>On click!</Button>
	);
}
```

## Recording a Page-View event

Recording a **page-view** event is something so usual that deserves simple and automatic usage.
Taking advantage of the React hooks, it makes sense to induce that it happens when the component is mounted.
Also, and by convention to get even more straightforward, a **page-view** event has the following shape:

`{ pageViewNamespace }_{ eventName }_{ suffix }`, where the values of `pageViewNamespace` is `jetpack_videopress` and `suffix` is `page_view` by default.
This naming convention aims to be consistent among all page-view events recorded by different apps, contexts, etc.

Being said that, it's possible to record the **page-view** event simply by defining the event name via the [pageViewEventName](#pagevieweventname-optional) of the hook settings:

```jsx
import useAnalyticsTracks from './hooks/use-analytics-tracks';

function MyAdminApp() {
	/*
	 * the following code will record
	 * the `jetpack_videopress_my_section_page_view` event.
	 */
	useAnalyticsTracks( {
		pageViewEventName: 'my_section'
	} );

	return <div>Hello, tracking world!</div>;
}
```