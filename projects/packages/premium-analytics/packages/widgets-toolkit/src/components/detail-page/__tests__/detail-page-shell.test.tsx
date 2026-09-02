/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { DetailPageShell } from '../detail-page-shell';

// The page's own scroll model hangs off this class; the shared style stub would
// leave it undefined.
jest.mock( '../detail-page-shell.module.scss', () => ( { page: 'page' } ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( { className, children }: { className?: string; children?: React.ReactNode } ) => (
		<div data-testid="page" className={ className }>
			{ children }
		</div>
	),
} ) );

describe( 'DetailPageShell', () => {
	it( 'lets its own child own the scroll, and keeps the caller class', () => {
		render( <DetailPageShell className="custom-page">body</DetailPageShell> );

		expect( screen.getByTestId( 'page' ) ).toHaveClass( 'page', 'custom-page' );
		expect( screen.getByText( 'body' ) ).toBeInTheDocument();
	} );
} );
