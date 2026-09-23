import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import AllPlaylistsEdit from '../edit';
import type { AllPlaylistsAttributes } from '../types';
import type { BlockEditProps } from '@wordpress/blocks';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
} ) );

const apiFetchMock = apiFetch as unknown as jest.Mock;

/**
 * Render the edit component.
 *
 * @param overrides     - Attribute overrides.
 * @param setAttributes - setAttributes mock.
 */
function renderEdit(
	overrides: Partial< AllPlaylistsAttributes > = {},
	setAttributes: jest.Mock = jest.fn()
) {
	const props = {
		attributes: { layout: 'grid', ...overrides },
		setAttributes,
		clientId: 'all-playlists-client-1',
	} as unknown as BlockEditProps< AllPlaylistsAttributes >;

	render( <AllPlaylistsEdit { ...props } /> );
}

beforeEach( () => {
	jest.clearAllMocks();
} );

describe( 'AllPlaylistsEdit', () => {
	it( 'renders the server-rendered markup for the current layout', async () => {
		apiFetchMock.mockResolvedValue( {
			rendered: '<div class="videopress-all-playlists is-layout-list">Playlists</div>',
		} );

		renderEdit( { layout: 'list' } );

		expect( screen.getByText( 'Loading playlists…' ) ).toBeInTheDocument();
		await expect( screen.findByText( 'Playlists' ) ).resolves.toBeInTheDocument();
		expect( apiFetchMock.mock.calls[ 0 ][ 0 ].path ).toContain(
			'/wp/v2/block-renderer/videopress/all-playlists'
		);
		expect( apiFetchMock.mock.calls[ 0 ][ 0 ].path ).toContain( 'layout%5D=list' );
	} );

	it( 'shows the empty placeholder when the site has no playlists', async () => {
		apiFetchMock.mockResolvedValue( { rendered: '' } );

		renderEdit();

		await expect( screen.findByText( 'No playlists yet' ) ).resolves.toBeInTheDocument();
	} );

	it( 'shows the error placeholder when rendering fails', async () => {
		apiFetchMock.mockRejectedValue( new Error( 'nope' ) );

		renderEdit();

		await expect(
			screen.findByText( 'The playlists could not be loaded' )
		).resolves.toBeInTheDocument();
	} );

	it( 'switches the layout from the sidebar', async () => {
		apiFetchMock.mockResolvedValue( { rendered: '' } );
		const setAttributes = jest.fn();

		renderEdit( {}, setAttributes );
		await waitFor( () => expect( apiFetchMock ).toHaveBeenCalled() );

		await userEvent.click( screen.getByRole( 'radio', { name: 'List' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( { layout: 'list' } );
	} );
} );
