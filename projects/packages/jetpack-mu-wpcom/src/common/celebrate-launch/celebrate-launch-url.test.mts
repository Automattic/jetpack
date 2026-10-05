import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CELEBRATE_LAUNCH_PARAM, withoutCelebrateLaunchParam } from './celebrate-launch-url.ts';

describe( 'withoutCelebrateLaunchParam', () => {
	it( 'removes the param from an absolute URL', () => {
		assert.equal(
			withoutCelebrateLaunchParam(
				'https://example.com/wp-admin/options-reading.php?celebrate-launch'
			),
			'https://example.com/wp-admin/options-reading.php'
		);
	} );

	it( 'removes the param but keeps other query args on an absolute URL', () => {
		assert.equal(
			withoutCelebrateLaunchParam(
				'https://example.com/wp-admin/options-reading.php?celebrate-launch&settings-updated=true'
			),
			'https://example.com/wp-admin/options-reading.php?settings-updated=true'
		);
	} );

	it( 'removes the param from a relative referer path, preserving its relative shape', () => {
		assert.equal(
			withoutCelebrateLaunchParam(
				'/wp-admin/options-reading.php?celebrate-launch&settings-updated=true'
			),
			'/wp-admin/options-reading.php?settings-updated=true'
		);
	} );

	it( 'returns the value unchanged when the param is absent', () => {
		assert.equal(
			withoutCelebrateLaunchParam( '/wp-admin/options-reading.php?settings-updated=true' ),
			'/wp-admin/options-reading.php?settings-updated=true'
		);
	} );

	it( 'exposes the param name it strips', () => {
		assert.equal( CELEBRATE_LAUNCH_PARAM, 'celebrate-launch' );
	} );
} );
