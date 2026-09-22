import { render, screen } from '@testing-library/react';
import JitmSlot from '../index.tsx';

describe( 'JitmSlot', () => {
	it( 'carries the id the JITM script looks for', () => {
		render( <JitmSlot /> );

		// `#jp-admin-notices` is the contract with packages/jitm's script, not a style hook.
		expect( screen.getByTestId( 'jp-jitm-slot' ) ).toHaveAttribute( 'id', 'jp-admin-notices' );
	} );

	it( 'keeps its own class when given another', () => {
		render( <JitmSlot className="jetpack-backup-jitm-card" /> );
		const slot = screen.getByTestId( 'jp-jitm-slot' );

		expect( slot ).toHaveClass( 'jp-jitm-slot' );
		expect( slot ).toHaveClass( 'jetpack-backup-jitm-card' );
	} );

	it( 'renders empty, so a page with no message shows nothing', () => {
		render( <JitmSlot /> );

		expect( screen.getByTestId( 'jp-jitm-slot' ) ).toBeEmptyDOMElement();
	} );
} );
