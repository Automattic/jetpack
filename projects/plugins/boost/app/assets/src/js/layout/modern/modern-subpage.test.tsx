/* This project does not load jest-dom, so its matchers are not available here. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content */
import { render, screen } from '@testing-library/react';
import ModernSubpage from './modern-subpage';
import type { Subpage } from '../../../../../../_inc/runtime-contract';

jest.mock( '../../pages/cache-debug-log/cache-debug-log-card', () => ( {
	__esModule: true,
	default: () => <div>cache debug log</div>,
} ) );
jest.mock( './subpage-frame', () => ( {
	__esModule: true,
	default: ( { title, children }: { title: string; children: React.ReactNode } ) => (
		<div>
			<h1>{ title }</h1>
			{ children }
		</div>
	),
} ) );
jest.mock( '../../pages/critical-css-advanced/critical-css-advanced-cards', () => ( {
	__esModule: true,
	default: () => <div>critical css advanced</div>,
} ) );
jest.mock( '../../pages/getting-started/getting-started', () => ( {
	__esModule: true,
	default: () => <div>getting started</div>,
} ) );
jest.mock( '../../pages/purchase-success/purchase-success', () => ( {
	__esModule: true,
	default: () => <div>purchase success</div>,
} ) );

describe( 'ModernSubpage', () => {
	it.each( [
		[ 'cache-debug-log', 'cache debug log' ],
		[ 'critical-css-advanced', 'critical css advanced' ],
		[ 'getting-started', 'getting started' ],
		[ 'purchase-successful', 'purchase success' ],
	] )( 'renders %s', ( subpage, expected ) => {
		render( <ModernSubpage subpage={ subpage as Subpage } /> );

		expect( screen.getByText( expected ) ).toBeTruthy();
	} );

	it.each( [
		[ 'cache-debug-log', 'Cache debug log' ],
		[ 'critical-css-advanced', 'Critical CSS recommendations' ],
	] )( 'frames %s with its title', ( subpage, title ) => {
		render( <ModernSubpage subpage={ subpage as Subpage } /> );

		expect( screen.getByRole( 'heading', { level: 1 } ).textContent ).toBe( title );
	} );

	it( 'renders only the requested sub-page', () => {
		render( <ModernSubpage subpage="getting-started" /> );

		expect(
			screen.queryAllByText( /cache debug log|critical css advanced|purchase success/ )
		).toHaveLength( 0 );
	} );
} );
