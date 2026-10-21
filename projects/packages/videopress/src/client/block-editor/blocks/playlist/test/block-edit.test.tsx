import { render, screen } from '@testing-library/react';
import { registerBlockType } from '@wordpress/blocks';
import '../index';
import type { PlaylistAttributes } from '../types';

jest.mock( '@wordpress/blocks', () => ( {
	registerBlockType: jest.fn(),
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	InnerBlocks: { Content: () => null },
} ) );
jest.mock( '../edit', () => ( {
	__esModule: true,
	default: () => <div data-testid="own-videos-edit" />,
} ) );
jest.mock( '../source-controls', () => ( {
	PlaylistSourcePanel: () => <div data-testid="source-panel" />,
	SourcedPlaylistEdit: () => <div data-testid="sourced-edit" />,
} ) );

const registerBlockTypeMock = registerBlockType as jest.Mock;

/**
 * Render the registered edit component.
 *
 * @param attributes - Block attributes.
 */
function renderEdit( attributes: Partial< PlaylistAttributes > ) {
	const { edit: Edit } = registerBlockTypeMock.mock.calls[ 0 ][ 1 ];
	render( <Edit attributes={ attributes } setAttributes={ jest.fn() } /> );
}

describe( 'playlist block edit', () => {
	it( 'edits the block’s own videos by default', () => {
		renderEdit( { videos: [] } );

		expect( screen.getByTestId( 'source-panel' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'own-videos-edit' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'sourced-edit' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the sourced placeholder for a playlist that shows another one', () => {
		renderEdit( { videos: [], source: 'index' } );

		expect( screen.getByTestId( 'sourced-edit' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'own-videos-edit' ) ).not.toBeInTheDocument();
	} );
} );
