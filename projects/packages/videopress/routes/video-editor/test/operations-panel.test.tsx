import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setFeatures, resetFeatures } from '../../../src/dashboard/test-utils/features';
import EditorOperationsPanel from '../operations-panel';

describe( 'EditorOperationsPanel', () => {
	beforeEach( () => setFeatures( { chaptersEditor: true } ) );
	afterEach( resetFeatures );
	it( 'shows and selects trim only when enabled', async () => {
		setFeatures( { trimCut: true } );
		const onSelect = jest.fn();
		render( <EditorOperationsPanel onSelect={ onSelect } /> );
		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Trim & cut' } ) );
		expect( onSelect ).toHaveBeenCalledWith( 'trim' );
	} );
	it( 'supports trim without chapters', () => {
		setFeatures( { trimCut: true, chaptersEditor: false } );
		render( <EditorOperationsPanel activeTool="trim" /> );
		expect( screen.queryByRole( 'button', { name: 'Chapters' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Trim & cut' } ) ).toHaveAttribute(
			'aria-current',
			'true'
		);
	} );
	it( 'renders the Edit section heading and tool list', () => {
		render( <EditorOperationsPanel /> );

		expect( screen.getByText( 'Edit' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'list', { name: 'Editing tools' } ) ).toBeInTheDocument();
	} );

	it( 'renders Chapters as the single, active tool', () => {
		render( <EditorOperationsPanel /> );

		const chapters = screen.getByTestId( 'video-editor-tool-chapters' );
		expect( chapters ).toHaveAttribute( 'aria-current', 'true' );
		expect( chapters ).toHaveTextContent( 'Chapters' );
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 1 );
	} );
} );
