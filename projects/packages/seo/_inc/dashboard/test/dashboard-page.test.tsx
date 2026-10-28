import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

// True-ESM Jest (`--experimental-vm-modules`): register mocks with
// `jest.unstable_mockModule`, then import the component under test dynamically.
// The page frame and the tab bar are stubbed so this covers DashboardPage's own
// wiring: whether the tabs render and which classes the content wrapper gets.
jest.unstable_mockModule( '@automattic/jetpack-components', () => ( {
	AdminPage: ( { title, children }: { title: string; children: ReactNode } ) => (
		<div>
			<h1>{ title }</h1>
			{ children }
		</div>
	),
	ThemeProvider: ( { children }: { children: ReactNode } ) => children,
} ) );
jest.unstable_mockModule( '../dashboard-nav', () => ( {
	default: ( { children }: { children: ReactNode } ) => (
		<div>
			<div role="tablist" />
			{ children }
		</div>
	),
} ) );
jest.unstable_mockModule( '../../data/record-seo-event', () => ( {
	recordScreenViewOnce: jest.fn(),
} ) );

const { default: DashboardPage } = await import( '../dashboard-page' );

describe( 'DashboardPage', () => {
	it( 'renders the tab bar around the content by default', () => {
		render( <DashboardPage active="overview">content</DashboardPage> );

		expect( screen.getByRole( 'tablist' ) ).toBeInTheDocument();
		expect( screen.getByText( 'content' ) ).toHaveClass( 'jetpack-seo-page-content' );
		expect( screen.getByText( 'content' ) ).not.toHaveClass( 'jetpack-seo-page-content--centered' );
	} );

	it( 'drops the tab bar but keeps the header when tabs are hidden', () => {
		render(
			<DashboardPage active="settings" showTabs={ false } centered>
				content
			</DashboardPage>
		);

		expect( screen.getByRole( 'heading', { level: 1, name: 'SEO' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'tablist' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'content' ) ).toHaveClass(
			'jetpack-seo-page-content',
			'jetpack-seo-page-content--centered'
		);
	} );
} );
