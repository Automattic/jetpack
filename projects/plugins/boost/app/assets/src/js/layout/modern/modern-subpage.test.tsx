/* This project does not load jest-dom, so its matchers are not available here. */
/* eslint-disable jest-dom/prefer-in-document */
import { render, screen } from '@testing-library/react';
import ModernSubpage from './modern-subpage';
import type { Subpage } from '../../../../../../_inc/runtime-contract';

jest.mock( '../../pages/cache-debug-log/cache-debug-log', () => ( {
	__esModule: true,
	default: () => <div>cache debug log</div>,
} ) );
jest.mock( '../../pages/critical-css-advanced/critical-css-advanced', () => ( {
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

	it( 'renders only the requested sub-page', () => {
		render( <ModernSubpage subpage="getting-started" /> );

		expect(
			screen.queryAllByText( /cache debug log|critical css advanced|purchase success/ )
		).toHaveLength( 0 );
	} );
} );
