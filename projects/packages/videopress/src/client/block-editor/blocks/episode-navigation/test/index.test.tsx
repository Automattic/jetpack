import { render, screen } from '@testing-library/react';
import { registerBlockType } from '@wordpress/blocks';
import '../index';

jest.mock( '@wordpress/blocks', () => ( {
	registerBlockType: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
} ) );

describe( 'episode navigation block registration', () => {
	it( 'registers videopress/episode-navigation as a dynamic block with an editor placeholder', () => {
		const [ name, settings ] = ( registerBlockType as jest.Mock ).mock.calls[ 0 ];
		expect( name ).toBe( 'videopress/episode-navigation' );
		expect( settings.title ).toBe( 'Episode Navigation' );
		// The markup comes from the PHP render callback, so nothing is serialized.
		expect( settings.save() ).toBeNull();

		const Edit = settings.edit;
		render( <Edit /> );
		expect(
			screen.getByText( /links to the previous and next video/, { ignore: '.a11y-speak-region' } )
		).toBeInTheDocument();
	} );
} );
