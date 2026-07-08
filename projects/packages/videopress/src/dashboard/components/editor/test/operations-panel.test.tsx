import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioEditorOperationsPanel from '../operations-panel';

describe( 'StudioEditorOperationsPanel', () => {
	it( 'marks the active tool and reports selection', async () => {
		const onSelect = jest.fn();
		render( <StudioEditorOperationsPanel activeTool="trim-cut" onSelect={ onSelect } /> );

		const trimCut = screen.getByTestId( 'studio-editor-tool-trim-cut' );
		expect( trimCut ).toHaveAttribute( 'aria-current', 'true' );
		expect( trimCut ).toHaveTextContent( 'Trim & cut' );

		await userEvent.click( trimCut );
		expect( onSelect ).toHaveBeenCalledWith( 'trim-cut' );
	} );

	it( 'renders the Edit section heading and tool list', () => {
		render( <StudioEditorOperationsPanel activeTool="trim-cut" onSelect={ () => {} } /> );

		expect( screen.getByText( 'Edit' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'list', { name: 'Editing tools' } ) ).toBeInTheDocument();
	} );
} );
