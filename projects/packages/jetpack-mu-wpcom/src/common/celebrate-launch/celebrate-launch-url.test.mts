import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	CELEBRATE_LAUNCH_PARAMS,
	hasCelebrateLaunchParam,
	withoutCelebrateLaunchParam,
} from './celebrate-launch-url.ts';

describe( 'hasCelebrateLaunchParam', () => {
	for ( const param of CELEBRATE_LAUNCH_PARAMS ) {
		it( `detects ${ param }`, () => {
			assert.equal(
				hasCelebrateLaunchParam( `https://example.com/wp-admin/?${ param }=true` ),
				true
			);
		} );
	}

	it( 'returns false when no param is present', () => {
		assert.equal( hasCelebrateLaunchParam( 'https://example.com/wp-admin/?foo=bar' ), false );
	} );
} );

describe( 'withoutCelebrateLaunchParam', () => {
	for ( const param of CELEBRATE_LAUNCH_PARAMS ) {
		it( `removes ${ param } from an absolute URL`, () => {
			assert.equal(
				withoutCelebrateLaunchParam(
					`https://example.com/wp-admin/options-reading.php?${ param }`
				),
				'https://example.com/wp-admin/options-reading.php'
			);
		} );

		it( `removes ${ param } but keeps other query args on an absolute URL`, () => {
			assert.equal(
				withoutCelebrateLaunchParam(
					`https://example.com/wp-admin/options-reading.php?${ param }=true&settings-updated=true`
				),
				'https://example.com/wp-admin/options-reading.php?settings-updated=true'
			);
		} );

		it( `removes ${ param } from a relative referer path, preserving its relative shape`, () => {
			assert.equal(
				withoutCelebrateLaunchParam(
					`/wp-admin/options-reading.php?${ param }&settings-updated=true`
				),
				'/wp-admin/options-reading.php?settings-updated=true'
			);
		} );
	}

	it( 'returns the value unchanged when the param is absent', () => {
		assert.equal(
			withoutCelebrateLaunchParam( '/wp-admin/options-reading.php?settings-updated=true' ),
			'/wp-admin/options-reading.php?settings-updated=true'
		);
	} );

	it( 'recognises both the wp-admin and the Calypso param names', () => {
		assert.deepEqual( [ ...CELEBRATE_LAUNCH_PARAMS ], [ 'celebrate-launch', 'celebrateLaunch' ] );
	} );
} );
