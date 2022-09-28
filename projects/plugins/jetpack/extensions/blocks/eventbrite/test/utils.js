import { convertToLink, eventIdFromUrl, normalizeUrlInput } from '../utils';

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: ( blockName, contentObj ) => ( { blockName, contentObj } ),
} ) );

describe( 'Eventbrite utils', () => {
	describe( 'eventIdFromUrl', () => {
		test( 'parses id from Eventbrite URL', () => {
			const validIUrl =
				'https://www.eventbrite.com.au/e/2021-nsw-open-championship-tickets-122642642445';
			expect( eventIdFromUrl( validIUrl ) ).toBe( 122642642445 );
		} );

		test( 'checks end of URL string for id only', () => {
			const validIUrl =
				'https://www.eventbrite.com.au/e/1119993333-nsw-open-championship-tickets-122642642445';
			expect( eventIdFromUrl( validIUrl ) ).toBe( 122642642445 );
		} );

		test( 'returns null when url is falsy', () => {
			expect( eventIdFromUrl( '' ) ).toBeNull();
			expect( eventIdFromUrl( false ) ).toBeNull();
			expect( eventIdFromUrl() ).toBeNull();
		} );
	} );

	describe( 'convertToLink', () => {
		const onReplace = jest.fn();

		beforeEach( () => {
			onReplace.mockClear();
		} );

		test( 'returns null when url is falsy', () => {
			convertToLink( 'https://test.com', onReplace );
			expect( onReplace ).toHaveBeenCalledWith( {
				blockName: 'core/paragraph',
				contentObj: {
					content: '<a href="https://test.com">https://test.com</a>',
				},
			} );
		} );
	} );

	describe( 'normalizeUrlInput', () => {
		test( 'returns null with invalid argument', () => {
			expect( normalizeUrlInput( 0 ) ).toBeNull();
			expect( normalizeUrlInput() ).toBeNull();
		} );

		test( 'does not modify valid argument', () => {
			const validUrl =
				'https://www.eventbrite.com.au/e/2021-nsw-open-championship-tickets-122642642445';
			expect( normalizeUrlInput( validUrl ) ).toEqual( validUrl );
		} );

		test( 'trims URL string', () => {
			const paddedURl =
				'   https://www.eventbrite.com.au/e/2021-nsw-open-championship-tickets-122642642445   ';
			expect( normalizeUrlInput( paddedURl ) ).toEqual( paddedURl.trim() );
		} );
	} );
} );
