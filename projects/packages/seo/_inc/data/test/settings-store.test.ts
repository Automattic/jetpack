import { createRegistry } from '@wordpress/data';
import { SEEDED_SETTINGS } from './fixtures/store-fixtures';
// eslint-disable-next-line import/order -- the fixture must seed the bootstrap global before the store reads DEFAULT_STATE.
import { settingsStore } from '../settings-store';
import type { SettingsResponse } from '../settings-types';

const makeRegistry = () => {
	const registry = createRegistry();
	registry.register( settingsStore );
	return registry;
};

describe( 'settings-store', () => {
	it( 'seeds the snapshot from the page bootstrap', () => {
		const registry = makeRegistry();
		expect( registry.select( settingsStore ).getSettings() ).toEqual( SEEDED_SETTINGS );
	} );

	it( 'replaces the snapshot on setSettings', () => {
		const registry = makeRegistry();
		const next: SettingsResponse = {
			...SEEDED_SETTINGS,
			front_page_description: 'Updated description.',
			search_engines_visible: false,
		};
		registry.dispatch( settingsStore ).setSettings( next );
		expect( registry.select( settingsStore ).getSettings() ).toEqual( next );
	} );
} );
