/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { DetailPageShell } from '../detail-page-shell';
import type { ReactNode } from 'react';

// The page's own scroll model hangs off this class; the shared style stub would
// leave it undefined.
jest.mock( '../detail-page-shell.module.scss', () => ( { page: 'page' } ) );

const mockPageProps: Record< string, unknown >[] = [];

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( { className, children, ...rest }: { className?: string; children?: ReactNode } ) => {
		mockPageProps.push( rest );

		return (
			<div data-testid="page" className={ className }>
				{ children }
			</div>
		);
	},
} ) );

describe( 'DetailPageShell', () => {
	beforeEach( () => {
		mockPageProps.length = 0;
	} );

	it( 'lets its own child own the scroll, and keeps the caller class', () => {
		render( <DetailPageShell className="custom-page">body</DetailPageShell> );

		expect( screen.getByTestId( 'page' ) ).toHaveClass( 'page', 'custom-page' );
		expect( screen.getByText( 'body' ) ).toBeInTheDocument();
	} );

	it( 'hands the rest of its props to the admin page', () => {
		const breadcrumbs = <nav />;
		const visual = <span />;

		render(
			<DetailPageShell breadcrumbs={ breadcrumbs } visual={ visual }>
				body
			</DetailPageShell>
		);

		expect( mockPageProps[ 0 ] ).toMatchObject( { breadcrumbs, visual } );
	} );
} );
