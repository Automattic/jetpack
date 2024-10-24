# wp-data-sync

Sync data from client to server and vice versa using @wordpress/data stores.

This package exports a function named `createWpDataSync` which lets you avoid creating all the boilerplate code to handle API calls, which means that you don't need to create any reducers, selectors or actions to handle the data sync.

## How to install wp-data-sync

```
npm install @automattic/wp-data-sync
pnpm add @automattic/wp-data-sync
yarn add @automattic/wp-data-sync
```

## Usage

### Step 1: Create the data sync

```ts
// store.ts
import { createWpDataSync } from '@automattic/wp-data-sync';
import { combineReducers, createReduxStore, register } from '@wordpress/data';

// Define the shape of the settings, if you use TypeScript.
type PluginSettings = {
	fieldOne: string;
	fieldTwo: number;
	fieldThree?: boolean;
};

// Define the initial state of your data
const initialState: PluginSettings = {
	fieldOne: 'some value',
	fieldTwo: 5,
};

// Create the data sync
const myPluginSettings = createWpDataSync( 'myPluginSettings', {
	endpoint: '/wp/v2/settings',
	initialState, // Optional
	extractFetchResponse: response => response.my_plugin_settings, // Optional
	prepareUpdateRequest: data => ( { my_plugin_settings: data } ), // Optional
} );
```

### Step 2: Pass the data sync to the store

```ts
// You can use only the parts you need.
// For example, if you only need the selectors, you can pass only the selectors.
export const store = createReduxStore( 'some-store-id', {
	reducer: combineReducers( {
		...myPluginSettings.reducers,
		// Other reducers
	} ),
	actions: {
		...myPluginSettings.actions,
		// Other actions
	},
	selectors: {
		...myPluginSettings.selectors,
		// Other selectors
	},
	resolvers: {
		...myPluginSettings.resolvers,
		// Other resolvers
	},
} );

register( store );
```

### Step 3: Use it in your components

```tsx
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from 'react';
import { store } from './store';

export const TestComponent = () => {
	const { settings, status, lastError } = useSelect( select => {
		return {
			settings: select( store ).getMyPluginSettings(),
			status: select( store ).getMyPluginSettingsStatus(),
			lastError: select( store ).getMyPluginSettingsLastError(),
		};
	}, [] );

	const { updateMyPluginSettings } = useDispatch( store );

	const onSubmit = useCallback( async () => {
		await updateMyPluginSettings( {
			fieldOne: 'some value from the UI',
			fieldTwo: 10,
			fieldThree: false,
		} );
	}, [ updateMyPluginSettings ] );

	return (
		<form onSubmit={ onSubmit }>
			{ status === 'fetching' ? (
				<p>Loading...</p>
			) : (
				<div>
					<input
						name="fieldOne"
						value={ settings.fieldOne }
						// other props
					/>
				</div>
			) }
			<br />
			<pre>{ JSON.stringify( { settings, status, lastError }, null, 2 ) }</pre>
		</form>
	);
};
```

## Type safety

All the selectors and actions returned are type safe and allow you to auto-complete suggestions

- Action auto completion
  ![image](https://github.com/user-attachments/assets/5d613843-87d0-4c71-9574-c9069e2552d2)
- Selector auto completion
  ![image](https://github.com/user-attachments/assets/c6457ee1-347a-4479-b6b5-5844b3057296)
- Action data auto completion
  ![image](https://github.com/user-attachments/assets/63507d5e-b8dc-465b-b035-41c12e5dcb62)
- Status auto-completion
  ![image](https://github.com/user-attachments/assets/93877ab3-ac23-4447-a932-2cc64f37e9fd)

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

wp-data-sync is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
