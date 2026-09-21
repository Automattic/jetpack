/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled -- This Jest project does not load jest-dom. */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import { useLcpState, useOptimizeLcpAction } from './lib/stores/lcp-state';
import Lcp from './lcp';
import type { LcpState } from './lib/stores/lcp-state-types';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '$features/module/module', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <section>{ children }</section>,
} ) );
jest.mock( './lib/stores/lcp-state', () => ( {
	useLcpState: jest.fn(),
	useOptimizeLcpAction: jest.fn(),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

const mutate = jest.fn();
const renderState = ( state: LcpState ) => {
	jest
		.mocked( useLcpState )
		.mockReturnValue( [ { data: state } ] as unknown as ReturnType< typeof useLcpState > );
	jest
		.mocked( useOptimizeLcpAction )
		.mockReturnValue( { mutate } as unknown as ReturnType< typeof useOptimizeLcpAction > );
	render(
		<ModuleSurfaceProvider value="row">
			<Lcp />
		</ModuleSurfaceProvider>
	);
};

test.each( [
	[ 'not_analyzed', "Click the optimize button to start optimizing your Cornerstone Page's LCP." ],
	[ 'pending', "Jetpack Boost is optimizing your Cornerstone Page's LCP for you." ],
	[ 'analyzed', /Last optimized/ ],
	[ 'error', "An error occurred while optimizing your Cornerstone Page's LCP. Please try again." ],
] as const )( 'shows %s in the status well and preserves the Optimize action', ( status, text ) => {
	mutate.mockClear();
	renderState( { status, pages: [], updated: 1 } );
	const well = within( screen.getByTestId( 'lcp-status-well' ) );
	const button = well.getByRole( 'button', { name: 'Optimize' } ) as HTMLButtonElement;
	expect( well.getByText( text ) ).toBeTruthy();
	expect( button.disabled ).toBe( status === 'pending' );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the synchronous control tests in this project.
	fireEvent.click( button );
	expect( mutate ).toHaveBeenCalledTimes( status === 'pending' ? 0 : 1 );
} );

test( 'keeps the issues notice and its expandable details beside the analyzed status', () => {
	renderState( {
		status: 'analyzed',
		updated: 1,
		pages: [
			{
				key: 'home',
				url: 'http://localhost/',
				status: 'error',
				errors: [ { type: 'lcp-timeout', meta: {} } ],
			},
		],
	} );
	expect( screen.getByText( 'LCP Optimization issues' ) ).toBeTruthy();
	expect( screen.getByText( '1 page could not be optimized.' ) ).toBeTruthy();
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the synchronous control tests in this project.
	fireEvent.click( screen.getByRole( 'button', { name: 'View details' } ) );
	expect(
		within( screen.getByRole( 'list' ) ).getByText(
			/The page took too long to load during analysis/
		)
	).toBeTruthy();
} );
