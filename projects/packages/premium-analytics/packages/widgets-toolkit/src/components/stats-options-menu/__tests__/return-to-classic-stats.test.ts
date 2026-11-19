/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { returnToClassicStats } from '../return-to-classic-stats';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'returnToClassicStats', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'lands on classic Stats in wp-admin', () => {
		const assign = jest.fn();

		returnToClassicStats( { assign } );

		expect( assign ).toHaveBeenCalledWith( 'https://example.com/wp-admin/admin.php?page=stats' );
	} );

	it( 'lands wherever the server says the classic Stats page is', () => {
		jest.mocked( getScriptData ).mockReturnValue( {
			premium_analytics: {
				classic_stats_url: 'https://example.com/wp-admin/admin.php?page=jetpack-stats',
			},
		} as ReturnType< typeof getScriptData > );
		const assign = jest.fn();

		returnToClassicStats( { assign } );

		expect( assign ).toHaveBeenCalledWith(
			'https://example.com/wp-admin/admin.php?page=jetpack-stats'
		);
	} );
} );
