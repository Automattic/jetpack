/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { isCsvExportEnabled } from '../is-csv-export-enabled';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );

const mockGetScriptData = getScriptData as jest.Mock;

describe( 'isCsvExportEnabled', () => {
	it( 'returns true only when the server enables CSV exports', () => {
		mockGetScriptData.mockReturnValue( {
			premium_analytics: {
				initial_full_sync_finished: 1,
				has_store_data: false,
				csv_exports_enabled: true,
			},
		} );

		expect( isCsvExportEnabled() ).toBe( true );
	} );

	it( 'returns false when the feature flag is absent', () => {
		mockGetScriptData.mockReturnValue( undefined );

		expect( isCsvExportEnabled() ).toBe( false );
	} );
} );
