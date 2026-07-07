import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// True-ESM Jest (`--experimental-vm-modules`): stub the REST/notices edge with
// `jest.unstable_mockModule`, then import the card dynamically. The card owns
// the useAuthorProfile hook, which reads and writes the current user through
// core's users endpoint — mocked here so the tests exercise the real hook,
// section, and card UI without a network.
const mockApiFetch = jest.fn< ( options: unknown ) => Promise< unknown > >();
const createInfoNotice = jest.fn();
const createSuccessNotice = jest.fn();
const createErrorNotice = jest.fn();

const AUTHOR_RESPONSE = {
	name: 'Jane Doe',
	description: 'Writes about search.',
	url: 'https://example.com/jane/',
	avatar_urls: { 96: 'https://example.test/avatar.jpg' },
	meta: {
		jetpack_seo_job_title: 'Creator',
		jetpack_seo_same_as: [ 'https://x.com/jane' ],
	},
};

const mockAuthorApi = () => {
	mockApiFetch.mockImplementation( options => {
		const request = options as { path?: string; method?: string; data?: Record< string, unknown > };
		if ( '/wp/v2/users/me?context=edit' === request.path ) {
			return Promise.resolve( AUTHOR_RESPONSE );
		}
		if ( '/wp/v2/users/me' === request.path && 'POST' === request.method ) {
			const data = request.data ?? {};
			return Promise.resolve( {
				...AUTHOR_RESPONSE,
				name: data.name,
				description: data.description,
				url: data.url,
				meta: data.meta,
			} );
		}
		return Promise.resolve( {} );
	} );
};

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: mockApiFetch } ) );
jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.unstable_mockModule( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' ) as object;
	return {
		...actual,
		useDispatch: () => ( { createInfoNotice, createSuccessNotice, createErrorNotice } ),
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
		// Default: a fetch that never settles, so tests of the loading state are stable.
		mockApiFetch.mockImplementation( () => new Promise( () => {} ) );
	} );

	it( 'renders collapsed by default, without a badge while loading', () => {
		renderCard();

		expect( screen.getByRole( 'button', { name: /Author profile/ } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		expect( screen.queryByText( 'Not set' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the fields from the current user and counts them in the header badge', async () => {
		mockAuthorApi();
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

	it( 'saves changes through core users REST', async () => {
		mockAuthorApi();
		renderCard();
		expand();

		const jobTitle = await screen.findByRole( 'textbox', { name: /Job title/ } );
		// eslint-disable-next-line testing-library/prefer-user-event -- single change; see note above.
		fireEvent.change( jobTitle, { target: { value: 'Lead Creator' } } );
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Save author profile/ } ) );

		const post = await waitFor( () => {
			const found = mockApiFetch.mock.calls.find(
				( [ options ] ) =>
					( options as { path?: string; method?: string } ).path === '/wp/v2/users/me' &&
					( options as { path?: string; method?: string } ).method === 'POST'
			);
			expect( found ).toBeDefined();
			return found;
		} );
		expect( post?.[ 0 ] ).toMatchObject( {
			path: '/wp/v2/users/me',
			method: 'POST',
			data: {
				name: 'Jane Doe',
				description: 'Writes about search.',
				url: 'https://example.com/jane/',
				meta: {
					jetpack_seo_job_title: 'Lead Creator',
					jetpack_seo_same_as: [ 'https://x.com/jane' ],
				},
			},
		} );
	} );
} );
