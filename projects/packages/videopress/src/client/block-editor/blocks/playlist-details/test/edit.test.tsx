import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlaylistDetailsEdit from '../edit';
import type { PlaylistDetailsAttributes } from '../edit';
import type { BlockEditProps } from '@wordpress/blocks';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '../../../channel/server-preview', () => ( {
	__esModule: true,
	default: () => null,
} ) );

describe( 'PlaylistDetailsEdit', () => {
	it.each( [
		{ name: 'Cover', attribute: 'showCover', from: true },
		{ name: 'Play all and Share buttons', attribute: 'showActions', from: false },
	] )( 'switches $name', async ( { name, attribute, from } ) => {
		const setAttributes = jest.fn();
		const props = {
			attributes: {
				source: 'queried',
				sourcePlaylistId: '',
				headingLevel: 0,
				showCover: true,
				showEyebrow: true,
				showChannel: true,
				showMeta: true,
				showDescription: true,
				showActions: true,
				[ attribute ]: from,
			},
			setAttributes,
		} as unknown as BlockEditProps< PlaylistDetailsAttributes >;
		render( <PlaylistDetailsEdit { ...props } /> );

		await userEvent.click( screen.getByRole( 'switch', { name } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { [ attribute ]: ! from } );
	} );
} );
