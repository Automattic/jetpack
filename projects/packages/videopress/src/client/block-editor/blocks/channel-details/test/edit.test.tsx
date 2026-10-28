import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChannelDetailsEdit from '../edit';
import type { ChannelDetailsAttributes } from '../edit';
import type { BlockEditProps } from '@wordpress/blocks';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '../../../channel/server-preview', () => ( {
	__esModule: true,
	default: () => null,
} ) );

/**
 * Render the edit component with the given details picked.
 *
 * @param items         - Picked details.
 * @param setAttributes - setAttributes mock.
 */
function renderEdit( items: ChannelDetailsAttributes[ 'items' ], setAttributes: jest.Mock ) {
	const props = {
		attributes: { items, layout: 'inline' },
		setAttributes,
	} as unknown as BlockEditProps< ChannelDetailsAttributes >;

	render( <ChannelDetailsEdit { ...props } /> );
}

describe( 'ChannelDetailsEdit', () => {
	it.each( [
		{ name: 'Subscribers', expected: [ 'handle', 'subscribers', 'videos' ] },
		{ name: 'Videos', expected: [ 'handle' ] },
	] )( 'toggles $name and keeps the details in display order', async ( { name, expected } ) => {
		const setAttributes = jest.fn();
		renderEdit( [ 'videos', 'handle' ], setAttributes );

		await userEvent.click( screen.getByRole( 'checkbox', { name } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { items: expected } );
	} );
} );
