import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import '../template-placements-notice';

jest.mock( '@wordpress/editor', () => ( { store: 'core/editor' } ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
} ) );

// A Proxy, since spreading the package reads its lazy exports before a circular import resolves.
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = { useSelect: jest.fn() };
	return new Proxy( actual, {
		get: ( target, property ) => mocks[ property ] ?? target[ property ],
	} );
} );

const mockEditorState = ( postType: string, placements?: Record< string, boolean > ) => {
	( useSelect as jest.Mock ).mockImplementation( callback =>
		callback( () => ( { getCurrentPostType: () => postType } ) )
	);
	Object.assign( window, {
		Jetpack_Editor_Initial_State: { jetpack: { subscribe_placements: placements } },
	} );
};

const BlockEdit = () => <div>Block content</div>;
const FilteredBlockEdit = applyFilters( 'editor.BlockEdit', BlockEdit ) as typeof BlockEdit;

const renderBlock = ( name: string, attributes: Record< string, string > ) =>
	render( <FilteredBlockEdit { ...( { name, attributes } as object ) } /> );

describe( 'TemplatePlacementsNotice', () => {
	it( 'lists enabled placements after the footer in a template', () => {
		mockEditorState( 'wp_template', {
			sm_enabled: true,
			jetpack_subscribe_overlay_enabled: false,
		} );

		renderBlock( 'core/template-part', { slug: 'footer' } );

		expect( screen.getByText( 'Block content' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Added by Newsletter settings' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'outside a template', 'post', { slug: 'footer' }, { sm_enabled: true } ],
		[ 'on a non-footer template part', 'wp_template', { slug: 'header' }, { sm_enabled: true } ],
		[ 'for non-admins, who get no placement values', 'wp_template', { slug: 'footer' }, undefined ],
		[ 'when no placement is enabled', 'wp_template', { slug: 'footer' }, { sm_enabled: false } ],
	] )( 'renders nothing %s', ( _label, postType, attributes, settings ) => {
		mockEditorState( postType, settings );

		renderBlock( 'core/template-part', attributes );

		expect( screen.getByText( 'Block content' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Added by Newsletter settings' ) ).not.toBeInTheDocument();
	} );
} );
