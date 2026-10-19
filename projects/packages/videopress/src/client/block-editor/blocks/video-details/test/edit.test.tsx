import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoDetailsEdit from '../edit';
import type { VideoDetailsAttributes } from '../edit';
import type { BlockEditProps } from '@wordpress/blocks';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '../../../channel/server-preview', () => ( {
	__esModule: true,
	default: () => null,
} ) );

describe( 'VideoDetailsEdit', () => {
	it.each( [
		{ name: 'Description', attribute: 'showDescription', from: true },
		{ name: 'Playlists', attribute: 'showPlaylists', from: false },
	] )( 'switches $name', async ( { name, attribute, from } ) => {
		const setAttributes = jest.fn();
		const props = {
			attributes: {
				source: 'queried',
				headingLevel: 0,
				showEyebrow: true,
				showTitle: true,
				showMeta: true,
				showDescription: true,
				showPlaylists: false,
				[ attribute ]: from,
			},
			setAttributes,
		} as unknown as BlockEditProps< VideoDetailsAttributes >;
		render( <VideoDetailsEdit { ...props } /> );

		await userEvent.click( screen.getByRole( 'switch', { name } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { [ attribute ]: ! from } );
	} );
} );
