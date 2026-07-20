/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */
import { render } from '@testing-library/react';
import JetpackAdminNotices from '../index.tsx';

describe( 'JetpackAdminNotices', () => {
	it( 'renders a single #jp-admin-notices mount with the base class and aria-live', () => {
		const { container } = render( <JetpackAdminNotices /> );
		const mounts = container.querySelectorAll( '#jp-admin-notices' );
		expect( mounts ).toHaveLength( 1 );
		expect( mounts[ 0 ] ).toHaveClass( 'jetpack-jitm-card' );
		expect( mounts[ 0 ] ).toHaveAttribute( 'aria-live', 'polite' );
	} );

	it( 'appends a passed className without dropping the base class', () => {
		const { container } = render( <JetpackAdminNotices className="custom-x" /> );
		const el = container.querySelector( '#jp-admin-notices' );
		expect( el ).toHaveClass( 'jetpack-jitm-card' );
		expect( el ).toHaveClass( 'custom-x' );
	} );
} );
