/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportPageShell } from '../../report-page/report-page-shell';
import { PageFooterProvider } from '../index';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( { children }: { children?: ReactNode } ) => <div data-testid="page">{ children }</div>,
} ) );

describe( 'ReportPageShell', () => {
	it( 'renders the footer the route provides after the page content', () => {
		render(
			<PageFooterProvider value={ <footer>Jetpack footer</footer> }>
				<ReportPageShell>
					<main>content</main>
				</ReportPageShell>
			</PageFooterProvider>
		);

		expect( screen.getByTestId( 'page' ) ).toHaveTextContent( /^content\s*Jetpack footer$/ );
	} );

	it( 'renders no footer when the route provides none', () => {
		render(
			<ReportPageShell>
				<main>content</main>
			</ReportPageShell>
		);

		expect( screen.getByTestId( 'page' ) ).toHaveTextContent( /^content$/ );
	} );
} );
