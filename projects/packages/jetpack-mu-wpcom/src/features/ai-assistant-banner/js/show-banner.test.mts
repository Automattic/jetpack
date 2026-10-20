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
		for ( const mcpEnabled of [ false, true, null, undefined ] ) {
			const banner = { hidden: true };
			const events: string[] = [];

			showBanner( banner, { trackProps, mcpEnabled }, name => events.push( name ) );

			assert.equal( banner.hidden, mcpEnabled !== false );
			assert.deepEqual(
				events,
				mcpEnabled === false ? [ 'jetpack_ai_assistant_banner_impression' ] : []
			);
		}
	} );
} );
