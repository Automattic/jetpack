// The Add Subscribers deep link only works if `SubscribersBody` acts on what
// `readAddSubscribersHash()` returns: opens the modal, opens it on the requested
// tab, and clears the hash afterwards. `add-subscribers-link.test.ts` covers the
// URL round trip, but every one of those assertions still passes if this wiring
// is deleted — so the wiring needs its own coverage.

const mockModal = jest.fn();

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
	useSearch: () => ( {} ),
} ) );

jest.mock( '../_inc/subscribers/data/use-import-completion-refresh', () => ( {
	useImportCompletionRefresh: () => {},
} ) );

jest.mock( '../_inc/subscribers/lib/dataviews-i18n', () => ( {
	installDataViewsFooterI18n: () => {},
} ) );

jest.mock( '../_inc/subscribers/lib/site', () => ( {
	getBlogId: () => 123,
} ) );

// Stand-in that records the props it was handed, so the assertions can read
// `initialTab` without depending on the modal's markup.
jest.mock( '../_inc/subscribers/components/modals/add-subscribers-modal', () => ( {
	__esModule: true,
	default: ( props: Record< string, unknown > ) => {
		mockModal( props );
		return null;
	},
} ) );

jest.mock( '../_inc/subscribers/components/header-actions', () => ( {
	__esModule: true,
	default: () => null,
} ) );

jest.mock( '../_inc/subscribers/components/subscribers-data-views', () => ( {
	__esModule: true,
	default: () => null,
} ) );

// Imports must come after the jest.mock factories above.
import { render } from '@testing-library/react';
import SubscribersBody from '../_inc/subscribers/components/subscribers-body';

/**
 * Render the shell with a given URL hash in place.
 *
 * @param hash - The hash to load with, including the leading `#`.
 */
function renderWithHash( hash: string ) {
	window.history.replaceState( {}, '', `/wp-admin/admin.php?page=jetpack-newsletter${ hash }` );

	render(
		<SubscribersBody importRefreshEnabled={ false }>{ ( { body } ) => body }</SubscribersBody>
	);
}

/**
 * The props the modal was last rendered with.
 *
 * @return The recorded props.
 */
function lastModalProps(): Record< string, unknown > {
	return mockModal.mock.calls[ mockModal.mock.calls.length - 1 ][ 0 ];
}

describe( 'Add Subscribers deep link wiring', () => {
	beforeEach( () => {
		mockModal.mockClear();
	} );

	it( 'opens the modal on the tab the hash asked for', () => {
		renderWithHash( '#add-subscribers=upload' );

		expect( lastModalProps() ).toEqual(
			expect.objectContaining( { isOpen: true, initialTab: 'upload' } )
		);
	} );

	it( 'opens on Manual for the bare hash', () => {
		renderWithHash( '#add-subscribers' );

		expect( lastModalProps() ).toEqual(
			expect.objectContaining( { isOpen: true, initialTab: 'manual' } )
		);
	} );

	it( 'clears the hash once it has been honored, so a reload does not reopen it', () => {
		renderWithHash( '#add-subscribers=upload' );

		expect( window.location.hash ).toBe( '' );
	} );

	it( 'stays closed without the hash, and leaves an unrelated hash alone', () => {
		renderWithHash( '#something-else' );

		expect( lastModalProps() ).toEqual( expect.objectContaining( { isOpen: false } ) );
		expect( window.location.hash ).toBe( '#something-else' );
	} );
} );
