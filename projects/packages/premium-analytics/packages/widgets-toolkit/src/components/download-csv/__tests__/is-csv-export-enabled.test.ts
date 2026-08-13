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

const mockGetScriptData = jest.mocked( getScriptData );

describe( 'isCsvExportEnabled', () => {
	it( 'defaults to enabled when the server flag is absent', () => {
		mockGetScriptData.mockReturnValue( undefined );

		expect( isCsvExportEnabled() ).toBe( true );
	} );

	it( 'returns false when the server explicitly disables CSV exports', () => {
		mockGetScriptData.mockReturnValue( {
			premium_analytics: {
				initial_full_sync_finished: 1,
				has_store_data: false,
				csv_exports_enabled: false,
			},
		} as ReturnType< typeof getScriptData > );

		expect( isCsvExportEnabled() ).toBe( false );
	} );
} );
