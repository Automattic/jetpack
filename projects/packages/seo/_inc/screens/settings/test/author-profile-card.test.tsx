import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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

const useEntityRecord = jest.fn();
const editEntity = jest.fn( ( patch: Record< string, unknown > ) => {
	edits = { ...edits, ...patch };
} );
const saveEditedEntityRecord = jest.fn( () => Promise.resolve() );
const createInfoNotice = jest.fn();
const createSuccessNotice = jest.fn();
const createErrorNotice = jest.fn();
let currentUser: { id?: number } | undefined;
let currentUserResolutionStatus: 'resolving' | 'finished' | 'error';
let entityRecord: typeof AUTHOR_RESPONSE | null;
// Local (in-browser) edits the mock replays into `editedRecord`; the store's
// single source of truth. Meta is replaced (not merged) — the user entity has
// no `mergedEdits`, matching the real behavior the hook relies on.
let edits: Record< string, unknown >;
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
		useDispatch: () => ( {
			createInfoNotice,
			createSuccessNotice,
			createErrorNotice,
			saveEditedEntityRecord,
		} ),
		useSelect: ( callback: ( select: ( store: string ) => unknown ) => unknown ) =>
			callback( () => ( {
				getCurrentUser: () => currentUser,
				getResolutionState: () => ( { status: currentUserResolutionStatus } ),
				isSavingEntityRecord: () => false,
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
		edits = {};
		entityHasResolved = false;
		entityIsResolving = false;
		entityStatus = 'IDLE';
		// The user entity is the single source of truth: `editedRecord` is the
		// persisted record with local edits replayed on top, `hasEdits` tracks
		// dirtiness. No store subscription in the mock, so tests `rerender()` to
		// flow a new edited state into the controlled inputs.
		useEntityRecord.mockImplementation( () => ( {
			record: entityRecord,
			editedRecord: { ...( entityRecord ?? {} ), ...edits },
			edit: editEntity,
			hasEdits: Object.keys( edits ).length > 0,
			isResolving: entityIsResolving,
			hasResolved: entityHasResolved,
			status: entityStatus,
		} ) );
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
		const { rerender } = renderCard();
		expand();

		const jobTitle = await screen.findByRole( 'textbox', { name: /Job title/ } );
		// eslint-disable-next-line testing-library/prefer-user-event -- single change; see note above.
		fireEvent.change( jobTitle, { target: { value: 'Lead Creator' } } );
		// The mock has no store subscription; rerender so the staged edit flows
		// into the controlled inputs and enables the (dirty) Save button.
		rerender( <AuthorProfileCard /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Save author profile/ } ) );

		await waitFor( () =>
			expect( saveEditedEntityRecord ).toHaveBeenCalledWith( 'root', 'user', 123, {
				throwOnError: true,
			} )
		);
		// Save stages the full cleaned record. The user entity replaces meta edits,
		// so both Jetpack keys ride the edit — the edited job title plus the
		// untouched social profile.
		expect( editEntity ).toHaveBeenLastCalledWith( {
			name: 'Jane Doe',
			description: 'Writes about search.',
			url: 'https://example.com/jane/',
			meta: {
				jetpack_seo_job_title: 'Lead Creator',
				jetpack_seo_same_as: [ 'https://x.com/jane' ],
			},
		} );
	} );
} );
