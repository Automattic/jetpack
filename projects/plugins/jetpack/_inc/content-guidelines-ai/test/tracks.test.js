import analytics from '@automattic/jetpack-analytics';
import { recordGuidelinesEvent, recordAiEvent } from '../lib/tracks';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

describe( 'tracks', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		delete window.jetpackContentGuidelinesAi;
	} );

	afterEach( () => {
		delete window.jetpackContentGuidelinesAi;
	} );

	it( 'prefixes guidelines events with jetpack_ai_guidelines_', () => {
		recordGuidelinesEvent( 'accept', { type: 'section', slug: 'copy' } );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_ai_guidelines_accept', {
			type: 'section',
			slug: 'copy',
			is_a11n: false,
		} );
	} );

	it( 'sends only the defaults when no properties are passed', () => {
		recordGuidelinesEvent( 'read_more_click' );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_guidelines_read_more_click',
			{ is_a11n: false }
		);
	} );

	it( 'records generic AI events with the name passed through verbatim', () => {
		recordAiEvent( 'jetpack_ai_upgrade_button', { placement: 'content-guidelines' } );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_ai_upgrade_button', {
			placement: 'content-guidelines',
			is_a11n: false,
		} );
	} );

	it( 'reports is_a11n false when the initial state is missing', () => {
		recordGuidelinesEvent( 'generate_all', { action: 'generate' } );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_guidelines_generate_all',
			{ action: 'generate', is_a11n: false }
		);
	} );

	it( 'marks Automattician traffic on guidelines events', () => {
		window.jetpackContentGuidelinesAi = { isA11n: true };

		recordGuidelinesEvent( 'generate_all', { action: 'generate' } );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_guidelines_generate_all',
			{ action: 'generate', is_a11n: true }
		);
	} );

	it( 'marks Automattician traffic on generic AI events', () => {
		window.jetpackContentGuidelinesAi = { isA11n: true };

		recordAiEvent( 'jetpack_ai_upgrade_button', { placement: 'content-guidelines' } );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_ai_upgrade_button', {
			placement: 'content-guidelines',
			is_a11n: true,
		} );
	} );

	it( 'coerces a non-boolean flag to a boolean', () => {
		window.jetpackContentGuidelinesAi = { isA11n: 1 };

		recordGuidelinesEvent( 'dismiss', { type: 'section', slug: 'site' } );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_ai_guidelines_dismiss', {
			type: 'section',
			slug: 'site',
			is_a11n: true,
		} );
	} );
} );
