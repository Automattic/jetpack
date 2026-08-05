import analytics from '@automattic/jetpack-analytics';
import { recordGuidelinesEvent, recordAiEvent } from '../lib/tracks';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

describe( 'tracks', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'prefixes guidelines events with jetpack_ai_guidelines_', () => {
		recordGuidelinesEvent( 'accept', { type: 'section', slug: 'copy' } );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_ai_guidelines_accept', {
			type: 'section',
			slug: 'copy',
		} );
	} );

	it( 'defaults properties to an empty object', () => {
		recordGuidelinesEvent( 'read_more_click' );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_guidelines_read_more_click',
			{}
		);
	} );

	it( 'records generic AI events with the name passed through verbatim', () => {
		recordAiEvent( 'jetpack_ai_upgrade_button', { placement: 'content-guidelines' } );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_ai_upgrade_button', {
			placement: 'content-guidelines',
		} );
	} );
} );
