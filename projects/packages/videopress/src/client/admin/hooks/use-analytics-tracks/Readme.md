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
	const { recordEvent } = useAnalyticsTracks( {
		pageViewEventName: 'jetpack_videopress_my_section_page_view',
	} );

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

```jsx
import useAnalyticsTracks from './hooks/use-analytics-tracks';

function MyAdminApp() {
	/*
	 * the following code will record
	 * the `jetpack_videopress_my_section_page_view` event.
	 */
	useAnalyticsTracks( {
		pageViewEventName: 'jetpack_videopress_my_section_page_view'
	} );

	return <div>Hello, tracking world!</div>;
}
```