import { render, screen, within } from '@testing-library/react';
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { createBlock, registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { createElement } from '@wordpress/element';
import metadata from '../block.json';
import CookieConsentPreview from '../preview';

beforeAll( () => {
	registerBlockType( 'core/button', {
		apiVersion: 3,
		title: 'Button',
		category: 'design',
		attributes: { text: { type: 'string' }, url: { type: 'string' } },
		edit: ( { attributes } ) =>
			createElement( 'input', { 'aria-label': 'Button text', defaultValue: attributes.text } ),
		save: ( { attributes } ) => createElement( 'a', { href: attributes.url }, attributes.text ),
	} );
	registerBlockType( metadata, { edit: CookieConsentPreview } );
} );

afterAll( () => {
	unregisterBlockType( metadata.name );
	unregisterBlockType( 'core/button' );
} );

it( 'previews the saved button label without its editor or link destination', async () => {
	const banner = createBlock( metadata.name, { text: '<strong>This site uses cookies.</strong>' }, [
		createBlock( 'core/button', { text: 'Accept cookies', url: 'https://example.com/' } ),
	] );
	render( createElement( BlockEditorProvider, { value: [ banner ] }, createElement( BlockList ) ) );

	const message = await screen.findByRole( 'paragraph' );
	expect(
		within( message ).getByText( 'This site uses cookies.', { selector: 'strong' } )
	).toBeVisible();
	expect( message ).not.toHaveAttribute( 'contenteditable', 'true' );
	expect( screen.getByText( 'Accept cookies' ) ).toBeVisible();
	expect( screen.queryByRole( 'link', { name: 'Accept cookies' } ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'textbox', { name: 'Button text' } ) ).not.toBeInTheDocument();
} );
