import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

// True-ESM Jest (`--experimental-vm-modules`): stub the core-data/notices edge with
// `jest.unstable_mockModule`, then import the card dynamically. The card owns
// the useAuthorProfile hook, which reads and writes the current user through the
// core-data user entity — mocked here so the tests exercise the real hook,
// section, and card UI without a network.
const AUTHOR_RESPONSE = {
	id: 123,
	name: 'Jane Doe',
	description: 'Writes about search.',
	url: 'https://example.com/jane/',
	avatar_urls: { 96: 'https://example.test/avatar.jpg' },
	meta: {
		jetpack_seo_job_title: 'Creator',
		jetpack_seo_same_as: [ 'https://x.com/jane' ],
	},
};

const saveEntityRecord =
	jest.fn<
		( kind: string, name: string, record: unknown, options: unknown ) => Promise< unknown >
	>();
const useEntityRecord = jest.fn();
const createInfoNotice = jest.fn();
const createSuccessNotice = jest.fn();
const createErrorNotice = jest.fn();
let currentUser: { id?: number } | undefined;
let currentUserResolutionStatus: 'resolving' | 'finished' | 'error';
let entityRecord: typeof AUTHOR_RESPONSE | null;
let entityHasResolved: boolean;
let entityIsResolving: boolean;
let entityStatus: 'IDLE' | 'RESOLVING' | 'SUCCESS' | 'ERROR';

const mockAuthorEntity = () => {
	currentUser = { id: AUTHOR_RESPONSE.id };
	currentUserResolutionStatus = 'finished';
	entityRecord = AUTHOR_RESPONSE;
	entityHasResolved = true;
	entityIsResolving = false;
	entityStatus = 'SUCCESS';
	saveEntityRecord.mockImplementation( ( _kind, _name, record ) =>
		Promise.resolve( { ...AUTHOR_RESPONSE, ...( record as Record< string, unknown > ) } )
	);
};

jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
	useEntityRecord,
} ) );
jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.unstable_mockModule( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' ) as object;
	return {
		...actual,
		useDispatch: ( store: string ) =>
			'core' === store
				? { saveEntityRecord }
				: { createInfoNotice, createSuccessNotice, createErrorNotice },
		useSelect: ( callback: ( select: ( store: string ) => unknown ) => unknown ) =>
			callback( () => ( {
				getCurrentUser: () => currentUser,
				getResolutionState: () => ( { status: currentUserResolutionStatus } ),
			} ) ),
	};
} );

const { default: AuthorProfileCard } = await import( '../author-profile-card' );

const renderCard = () => render( <AuthorProfileCard /> );

const expand = () =>
	// eslint-disable-next-line testing-library/prefer-user-event -- single click; fireEvent avoids the user-event devDep (lockfile churn).
	fireEvent.click( screen.getByRole( 'button', { name: /Author profile/ } ) );

describe( 'AuthorProfileCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		currentUser = undefined;
		currentUserResolutionStatus = 'resolving';
		entityRecord = null;
		entityHasResolved = false;
		entityIsResolving = false;
		entityStatus = 'IDLE';
		useEntityRecord.mockImplementation( () => ( {
			record: entityRecord,
			isResolving: entityIsResolving,
			hasResolved: entityHasResolved,
			status: entityStatus,
		} ) );
		saveEntityRecord.mockImplementation( () => new Promise( () => {} ) );
	} );

	it( 'renders collapsed by default, without a badge while loading', () => {
		renderCard();

		expect( screen.getByRole( 'button', { name: /Author profile/ } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		expect( screen.queryByText( 'Not set' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps loading when core-data returns the initial empty current user', () => {
		currentUser = {};
		renderCard();

		expect( screen.queryByText( 'Not set' ) ).not.toBeInTheDocument();
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'renders the fields from the current user and counts them in the header badge', async () => {
		mockAuthorEntity();
		renderCard();
		expand();

		await expect( screen.findByDisplayValue( 'Jane Doe' ) ).resolves.toBeInTheDocument();
		expect( screen.getByDisplayValue( 'Writes about search.' ) ).toBeInTheDocument();
		expect( screen.getByDisplayValue( 'https://example.com/jane/' ) ).toBeInTheDocument();
		expect( screen.getByDisplayValue( 'Creator' ) ).toBeInTheDocument();
		expect( screen.getByDisplayValue( 'https://x.com/jane' ) ).toBeInTheDocument();
		expect( screen.getByAltText( 'Author avatar' ) ).toHaveAttribute(
			'src',
			'https://example.test/avatar.jpg'
		);
		// Bio, website, job title, and a social profile are all filled.
		expect( screen.getByText( '4 of 4 set' ) ).toBeInTheDocument();
	} );

	it( 'saves changes through the core user entity', async () => {
		mockAuthorEntity();
		renderCard();
		expand();

		const jobTitle = await screen.findByRole( 'textbox', { name: /Job title/ } );
		// eslint-disable-next-line testing-library/prefer-user-event -- single change; see note above.
		fireEvent.change( jobTitle, { target: { value: 'Lead Creator' } } );
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Save author profile/ } ) );

		const save = await waitFor( () => {
			expect( saveEntityRecord ).toHaveBeenCalled();
			return saveEntityRecord.mock.calls[ 0 ];
		} );
		expect( save ).toEqual( [
			'root',
			'user',
			{
				id: AUTHOR_RESPONSE.id,
				name: 'Jane Doe',
				description: 'Writes about search.',
				url: 'https://example.com/jane/',
				meta: {
					jetpack_seo_job_title: 'Lead Creator',
					jetpack_seo_same_as: [ 'https://x.com/jane' ],
				},
			},
			{ throwOnError: true },
		] );
	} );

	it( 'does not update state after unmounting during save', async () => {
		mockAuthorEntity();
		let resolveSave: ( value: unknown ) => void = () => {};
		saveEntityRecord.mockImplementation(
			() =>
				new Promise( resolve => {
					resolveSave = resolve;
				} )
		);
		const { unmount } = renderCard();
		expand();

		const jobTitle = await screen.findByRole( 'textbox', { name: /Job title/ } );
		// eslint-disable-next-line testing-library/prefer-user-event -- single change; see note above.
		fireEvent.change( jobTitle, { target: { value: 'Lead Creator' } } );
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Save author profile/ } ) );
		expect( saveEntityRecord ).toHaveBeenCalled();

		unmount();
		await act( async () => {
			resolveSave( AUTHOR_RESPONSE );
			await Promise.resolve();
		} );

		expect( createSuccessNotice ).not.toHaveBeenCalled();
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );
} );
