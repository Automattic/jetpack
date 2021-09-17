Observer Package
=========

The package lets you subscribe to events triggered in other packages.

## Architecture

The package consists of three classes:
- **Subscribers**, where package consumers add their callbacks attached to certain events.
- **Observer**, each object of which holds multiple subscribers. There may be multiple observers.
- **Registry** holds the observers, and notifies them when it gets pinged.

## Package Integration

1. Create a separate `events.jsx` file in the package root directory, make sure that its exported alongsize the main `index.jsx`.
The file should export the event labels as constants:
```js
export const CONNECTION_SITE_CONNECTED = 'CONNECTION_SITE_CONNECTED';
export const CONNECTION_DISCONNECTED = 'CONNECTION_DISCONNECTED';
```
2. Add `@automattic/jetpack-observer` as a dependency to your package.
3. To fire an event, import the event constant and the `fireEvent` function, and fire the event:
```js
import { fireEvent } from '@automattic/jetpack-observer';
import { CONNECTION_DISCONNECTED } from '../../events';

// When the time comes...
fireEvent( CONNECTION_DISCONNECTED );
```

That's it!

## Consumer Integration
1. First, add `@automattic/jetpack-observer` as a dependency to your app.
2. Import the event constant you need from the package:
```js
import { CONNECTION_DISCONNECTED } from '@automattic/jetpack-connection/events';
```
3. Define the subscribers (callbacks), build the `Observer` object, and add it to the registry:
```js
const subscribers = new Subscribers();
subscribers.add( CONNECTION_DISCONNECTED, () => {
	alert( 'The site just got disconnected  ¯\_(ツ)_/¯');
} );
registerObserver( new Observer( subscribers ) );
```

Simple as that!
