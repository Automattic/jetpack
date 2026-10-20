import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const actualCompose = await import( '@wordpress/compose' );
await jest.unstable_mockModule( '@wordpress/compose', () => ( {
	...actualCompose,
	// Skip the real clipboard and report success on click, which advances the modal to the snippets.
	useCopyToClipboard: ( _text, onSuccess ) => node => node?.addEventListener( 'click', onSuccess ),
} ) );

const actualData = await import( '@wordpress/data' );
await jest.unstable_mockModule( '@wordpress/data', () => ( {
	...actualData,
	useSelect: () => ( { postId: 123, postTitle: 'Contact', pageRecords: [] } ),
	useDispatch: () => ( { saveEntityRecord: jest.fn(), createErrorNotice: jest.fn() } ),
} ) );

const { EmbedFormModal } = await import( '../embed-form-modal.tsx' );

describe( 'EmbedFormModal', () => {
	it.each( [
		[ 'Embed code', 'Paste into the block editor or code editor.' ],
		[ 'Shortcode', 'Use in the classic editor, widgets, or anywhere shortcodes are supported.' ],
	] )( 'labels and describes the %s snippet field', async ( name, description ) => {
		const user = userEvent.setup();
		render( <EmbedFormModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Copy and add manually' } ) );

		expect( screen.getByRole( 'textbox', { name } ) ).toHaveAccessibleDescription( description );
	} );
} );
