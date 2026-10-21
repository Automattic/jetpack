import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { showBanner } from './show-banner.ts';

const trackProps = { surface: 'dashboard' };

describe( 'showBanner', () => {
	it( 'records an impression when the Agent is off and the banner is visible', () => {
		const banner = { hidden: false };
		const events: string[] = [];

		showBanner( banner, { trackProps }, name => events.push( name ) );

		assert.equal( banner.hidden, false );
		assert.deepEqual( events, [ 'jetpack_ai_assistant_banner_impression' ] );
	} );

	it( 'uses the server visibility decision for a hidden banner', () => {
		for ( const shouldShowBanner of [ '1', '0', undefined ] as const ) {
			const banner = { hidden: true };
			const events: string[] = [];

			showBanner( banner, { trackProps, shouldShowBanner }, name => events.push( name ) );

			assert.equal( banner.hidden, shouldShowBanner !== '1' );
			assert.deepEqual(
				events,
				shouldShowBanner === '1' ? [ 'jetpack_ai_assistant_banner_impression' ] : []
			);
		}
	} );

	it( 'hides a visible banner when the server says not to show it', () => {
		const banner = { hidden: false };
		const events: string[] = [];

		showBanner( banner, { trackProps, shouldShowBanner: '0' }, name => events.push( name ) );

		assert.equal( banner.hidden, true );
		assert.deepEqual( events, [] );
	} );
} );
