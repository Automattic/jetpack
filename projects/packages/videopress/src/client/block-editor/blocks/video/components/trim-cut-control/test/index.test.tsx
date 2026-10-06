import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrimCutControl from '..';

jest.mock( '@wordpress/components', () => ( {
	ToolbarButton: ( { label, disabled, onClick } ) => (
		<button disabled={ disabled } onClick={ onClick }>
			{ label }
		</button>
	),
} ) );

jest.mock( '../../../../../../components/trim-cut-modal/lazy', () => ( {
	__esModule: true,
	default: ( { guid, attachmentId, onClose, onProcessed } ) => (
		<div role="dialog" aria-label="Trim & cut">
			<span>
				{ guid }:{ attachmentId }
			</span>
			<button onClick={ onClose }>Close</button>
			<button onClick={ onProcessed }>Finish processing</button>
		</div>
	),
} ) );
const win = window as unknown as { videoPressEditorState?: Record< string, unknown > };
const attributes = { guid: 'clip123', id: 42, title: 'Test video' };

beforeEach( () => {
	jest.clearAllMocks();
	win.videoPressEditorState = { trimCutEnabled: '1' };
} );
afterEach( () => {
	delete win.videoPressEditorState;
} );

it.each( [ undefined, false, '', '0' ] )( 'hides the toolbar and modal with flag %s', enabled => {
	win.videoPressEditorState = { trimCutEnabled: enabled };
	render(
		<TrimCutControl
			attributes={ attributes }
			setAttributes={ jest.fn() }
			onProcessed={ jest.fn() }
		/>
	);
	expect( screen.queryByRole( 'button', { name: 'Trim & cut' } ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
} );

it.each( [
	{ guid: '', id: 42 },
	{ guid: 'clip123', id: 0 },
] )( 'disables the control without video identity: %s', identity => {
	render(
		<TrimCutControl
			attributes={ { ...attributes, ...identity } }
			setAttributes={ jest.fn() }
			onProcessed={ jest.fn() }
		/>
	);
	expect( screen.getByRole( 'button', { name: 'Trim & cut' } ) ).toBeDisabled();
} );

it( 'opens on demand, notifies the block after processing, and closes without changing attributes', async () => {
	const user = userEvent.setup();
	const setAttributes = jest.fn();
	const onProcessed = jest.fn();
	render(
		<TrimCutControl
			attributes={ attributes }
			setAttributes={ setAttributes }
			onProcessed={ onProcessed }
		/>
	);
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	await user.click( screen.getByRole( 'button', { name: 'Trim & cut' } ) );
	expect( screen.getByRole( 'dialog' ) ).toHaveTextContent( 'clip123:42' );
	await user.click( screen.getByRole( 'button', { name: 'Finish processing' } ) );
	expect( onProcessed ).toHaveBeenCalledTimes( 1 );
	expect( setAttributes ).not.toHaveBeenCalled();
	await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
} );
