import { Suspense } from 'react';
import { act, render } from 'test/test-utils';
import Privacy from '../index';

jest.mock( 'components/module-settings/with-module-settings-form-helpers', () => ( {
	withModuleSettingsFormHelpers: Component => Component,
} ) );
jest.mock( 'state/tracking/actions', () => ( {
	fetchTrackingSettings: jest.fn( () => ( { type: 'TEST_FETCH_TRACKING_SETTINGS' } ) ),
	updateTrackingSettings: jest.fn( () => ( { type: 'TEST_UPDATE_TRACKING_SETTINGS' } ) ),
} ) );

const { fetchTrackingSettings } = jest.requireMock( 'state/tracking/actions' );

const initialState = {
	jetpack: {
		settings: { items: {} },
		trackingSettings: { items: {}, requests: {} },
	},
};

describe( 'Privacy settings', () => {
	it( 'fetches the tracking settings once when a sibling suspends its first render', async () => {
		let resolve;
		const pending = new Promise( r => ( resolve = r ) );
		let ready = false;
		pending.then( () => ( ready = true ) );
		const SuspendsOnce = () => {
			if ( ! ready ) {
				throw pending;
			}
			return null;
		};

		render(
			<Suspense fallback={ null }>
				<Privacy />
				<SuspendsOnce />
			</Suspense>,
			{ initialState }
		);
		await act( async () => resolve() );

		expect( fetchTrackingSettings ).toHaveBeenCalledTimes( 1 );
	} );
} );
