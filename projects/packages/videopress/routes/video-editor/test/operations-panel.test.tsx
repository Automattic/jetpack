import { render, screen } from '@testing-library/react';
import EditorOperationsPanel from '../operations-panel';

describe( 'EditorOperationsPanel', () => {
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
