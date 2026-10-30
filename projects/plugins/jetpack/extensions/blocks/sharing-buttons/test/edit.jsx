import { render, screen, within } from '@testing-library/react';
import { BlockEditorProvider, BlockInspector, BlockList } from '@wordpress/block-editor';
import { createBlock, registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { SlotFillProvider } from '@wordpress/components';
import buttonMetadata from '../../sharing-button/block.json';
import buttonEdit from '../../sharing-button/edit';
import variations from '../../sharing-button/variations';
import metadata from '../block.json';
import edit from '../edit';
import save from '../save';

describe( 'sharing buttons block inspector', () => {
	beforeAll( () => {
		registerBlockType( metadata, { edit, save } );
		registerBlockType( buttonMetadata, { edit: buttonEdit, save: () => null, variations } );
	} );

	afterAll( () => {
		unregisterBlockType( buttonMetadata.name );
		unregisterBlockType( metadata.name );
	} );

	it( 'lists the inner buttons in a List View tab', async () => {
		const block = createBlock( metadata.name, {}, [
			createBlock( buttonMetadata.name, { service: 'facebook' } ),
			createBlock( buttonMetadata.name, { service: 'mastodon' } ),
		] );
		const selection = { clientId: block.clientId };

		render(
			<SlotFillProvider>
				<BlockEditorProvider
					value={ [ block ] }
					selection={ { selectionStart: selection, selectionEnd: selection } }
				>
					<BlockInspector />
					<BlockList />
				</BlockEditorProvider>
			</SlotFillProvider>
		);

		await expect( screen.findByRole( 'tab', { name: 'List View' } ) ).resolves.toBeInTheDocument();
		const tree = screen.getByRole( 'treegrid', { name: 'Block navigation structure' } );
		expect( within( tree ).getByRole( 'link', { name: /Facebook/ } ) ).toBeInTheDocument();
		expect( within( tree ).getByRole( 'link', { name: /Mastodon/ } ) ).toBeInTheDocument();
		await expect(
			within( tree ).findByRole( 'button', { name: /Add/ } )
		).resolves.toBeInTheDocument();
	} );
} );
