import { renderHook } from '@testing-library/react';
import useTitleHeading, { headingText } from '../use-title-heading';

// The playlist's inner blocks, as the block-editor store would return them.
let mockInnerBlocks: Array< { clientId: string; attributes: { content?: unknown } } > = [];
const mockUpdateBlockAttributes = jest.fn();

jest.mock( '@wordpress/block-editor', () => ( { store: 'core/block-editor' } ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( selector: ( select: unknown ) => unknown ) =>
		selector( () => ( { getBlocks: () => mockInnerBlocks } ) ),
	useDispatch: () => ( { updateBlockAttributes: mockUpdateBlockAttributes } ),
} ) );

beforeEach( () => {
	mockInnerBlocks = [];
	mockUpdateBlockAttributes.mockClear();
} );

/**
 * Render the hook with the given title state.
 *
 * @param playlistTitle     - Title attribute.
 * @param showPlaylistTitle - Whether the heading is shown.
 * @param setAttributes     - setAttributes mock.
 * @return The renderHook result.
 */
function renderTitleHeading(
	playlistTitle: string,
	showPlaylistTitle = true,
	setAttributes: jest.Mock = jest.fn()
) {
	return renderHook(
		props =>
			useTitleHeading( {
				clientId: 'playlist',
				setAttributes,
				...props,
			} ),
		{ initialProps: { playlistTitle, showPlaylistTitle } }
	);
}

describe( 'headingText', () => {
	it( 'drops markup and decodes entities', () => {
		expect( headingText( 'Tom <strong>&amp;</strong> Jerry' ) ).toBe( 'Tom & Jerry' );
		expect( headingText( 'Plain' ) ).toBe( 'Plain' );
		expect( headingText( undefined ) ).toBe( '' );
	} );

	it( 'reads RichTextData-like values through their string form', () => {
		expect( headingText( { toString: () => '<em>Rich</em>' } ) ).toBe( 'Rich' );
	} );
} );

describe( 'useTitleHeading', () => {
	it( 'templates an escaped heading while the title is shown', () => {
		const { result } = renderTitleHeading( 'Tom & <Jerry>' );

		expect( result.current.template ).toEqual( [
			[ 'core/heading', expect.objectContaining( { level: 2, content: 'Tom &amp; &lt;Jerry>' } ) ],
		] );
	} );

	it( 'templates no heading once it is hidden', () => {
		const { result } = renderTitleHeading( 'Summer', false );
		expect( result.current.template ).toEqual( [] );
	} );

	it( 'updates the attribute and the heading from the sidebar', () => {
		mockInnerBlocks = [ { clientId: 'heading', attributes: { content: 'Summer' } } ];
		const setAttributes = jest.fn();
		const { result } = renderTitleHeading( 'Summer', true, setAttributes );

		result.current.setPlaylistTitle( 'Fish & chips' );

		expect( setAttributes ).toHaveBeenCalledWith( { playlistTitle: 'Fish & chips' } );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'heading', {
			content: 'Fish &amp; chips',
		} );
	} );

	it( 'only updates the attribute while there is no heading', () => {
		const setAttributes = jest.fn();
		const { result } = renderTitleHeading( '', false, setAttributes );

		result.current.setPlaylistTitle( 'Summer' );

		expect( setAttributes ).toHaveBeenCalledWith( { playlistTitle: 'Summer' } );
		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );

	it( 'copies edits made in the heading into the attribute', () => {
		mockInnerBlocks = [ { clientId: 'heading', attributes: { content: 'Summer' } } ];
		const setAttributes = jest.fn();
		const { rerender } = renderTitleHeading( 'Summer', true, setAttributes );
		expect( setAttributes ).not.toHaveBeenCalled();

		mockInnerBlocks = [
			{ clientId: 'heading', attributes: { content: 'Summer <em>&amp;</em> sun' } },
		];
		rerender( { playlistTitle: 'Summer', showPlaylistTitle: true } );

		expect( setAttributes ).toHaveBeenCalledWith( { playlistTitle: 'Summer & sun' } );
	} );

	it( 'leaves the attribute alone when only the attribute changed', () => {
		mockInnerBlocks = [ { clientId: 'heading', attributes: { content: 'Summer' } } ];
		const setAttributes = jest.fn();
		const { rerender } = renderTitleHeading( 'Summer', true, setAttributes );

		rerender( { playlistTitle: 'Undone', showPlaylistTitle: true } );

		expect( setAttributes ).not.toHaveBeenCalled();
	} );
} );
