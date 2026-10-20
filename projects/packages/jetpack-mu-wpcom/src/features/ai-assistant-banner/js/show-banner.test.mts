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

	it( 'reveals a hidden banner only when MCP is explicitly off', () => {
		for ( const mcpState of [ 'off', 'on', 'unavailable', undefined ] as const ) {
			const banner = { hidden: true };
			const events: string[] = [];

			showBanner( banner, { trackProps, mcpState }, name => events.push( name ) );

			assert.equal( banner.hidden, mcpState !== 'off' );
			assert.deepEqual(
				events,
				mcpState === 'off' ? [ 'jetpack_ai_assistant_banner_impression' ] : []
			);
		}
	} );
} );
