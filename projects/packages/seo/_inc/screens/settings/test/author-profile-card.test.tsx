import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// True-ESM Jest (`--experimental-vm-modules`): stub the REST and notices edges with
// `jest.unstable_mockModule`, then import the card dynamically so the tests exercise
// the real hook, section, and card UI without a network.
const STORED_PROFILE = {
	name: 'Jane Doe',
	description: 'Writes about search.',
	url: 'https://example.com/jane/',
	jobTitle: 'Creator',
	sameAs: [ 'https://x.com/jane' ],
	avatarUrl: 'https://example.test/avatar.jpg',
	accountProfileUrl: '',
};

const mockApiFetch = jest.fn< ( options: { method?: string } ) => Promise< unknown > >();
const createInfoNotice = jest.fn();
const createSuccessNotice = jest.fn();
const createErrorNotice = jest.fn();

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
	} );

	it( 'renders collapsed by default, without a status while loading', () => {
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );
		renderCard();

		expect( screen.getByRole( 'button', { name: /Author profile/ } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		expect( screen.queryByText( 'Not started' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the stored profile and reports complete in the header', async () => {
		mockApiFetch.mockResolvedValue( STORED_PROFILE );
		renderCard();
		expand();

		await expect( screen.findByDisplayValue( 'Jane Doe' ) ).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith( { path: '/jetpack/v4/seo/author-profile' } );
		expect( screen.getByDisplayValue( 'Writes about search.' ) ).toBeInTheDocument();
		expect( screen.getByDisplayValue( 'https://example.com/jane/' ) ).toBeInTheDocument();
		expect( screen.getByDisplayValue( 'Creator' ) ).toBeInTheDocument();
		expect( screen.getByDisplayValue( 'https://x.com/jane' ) ).toBeInTheDocument();
		expect( screen.getByAltText( 'Author avatar' ) ).toHaveAttribute(
			'src',
			'https://example.test/avatar.jpg'
		);
		expect( screen.getByText( 'Complete' ) ).toBeInTheDocument();
	} );

	it( 'posts the cleaned profile and shows what the server stored', async () => {
		// The stored job title comes back unchanged, as if the server had dropped the edit.
		mockApiFetch.mockImplementation( ( { method } ) =>
			Promise.resolve( method === 'POST' ? { ...STORED_PROFILE } : STORED_PROFILE )
		);
		renderCard();
		expand();

		const jobTitle = await screen.findByRole( 'textbox', { name: /Job title/ } );
		// eslint-disable-next-line testing-library/prefer-user-event -- single change; see note above.
		fireEvent.change( jobTitle, { target: { value: '  Lead Creator  ' } } );
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Save author profile/ } ) );

		await waitFor( () => expect( createSuccessNotice ).toHaveBeenCalled() );
		expect( mockApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack/v4/seo/author-profile',
			method: 'POST',
			data: {
				name: 'Jane Doe',
				description: 'Writes about search.',
				url: 'https://example.com/jane/',
				jobTitle: 'Lead Creator',
				sameAs: [ 'https://x.com/jane' ],
			},
		} );
		expect( screen.getByRole( 'textbox', { name: /Job title/ } ) ).toHaveValue( 'Creator' );
	} );

	it( 'reports a failed load and locks the form so empty values cannot be saved', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'rest_forbidden' ) );
		renderCard();
		expand();

		await waitFor( () =>
			expect( createErrorNotice ).toHaveBeenCalledWith(
				'Could not load author profile settings. Please try again.',
				expect.anything()
			)
		);
		expect( screen.getByRole( 'textbox', { name: 'Name' } ) ).toBeDisabled();
		expect( screen.getByRole( 'textbox', { name: /Job title/ } ) ).toBeDisabled();
	} );

	it( 'shows WordPress.com-owned fields as text and saves only the SEO fields', async () => {
		mockApiFetch.mockResolvedValue( {
			...STORED_PROFILE,
			description: '',
			accountProfileUrl: 'https://my.wordpress.com/me/account',
		} );
		renderCard();
		expand();

		await expect( screen.findByText( 'Jane Doe' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'https://example.com/jane/' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Not set' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'textbox', { name: 'Name' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'textbox', { name: 'Bio' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'textbox', { name: 'Website' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Edit on WordPress.com/ } ) ).toHaveAttribute(
			'href',
			'https://my.wordpress.com/me/account'
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- single change; see note above.
		fireEvent.change( screen.getByRole( 'textbox', { name: /Job title/ } ), {
			target: { value: 'Editor' },
		} );
		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: /Save author profile/ } ) );

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenLastCalledWith( {
				path: '/jetpack/v4/seo/author-profile',
				method: 'POST',
				data: { jobTitle: 'Editor', sameAs: [ 'https://x.com/jane' ] },
			} )
		);
	} );
} );
