/* eslint-disable jest-dom/prefer-in-document -- This Jest project does not load jest-dom. */
import { render, screen } from '@testing-library/react';
import GraphComponent from './graph-component';
import type { ReactNode } from 'react';

jest.mock( '@automattic/jetpack-components', () => ( {
	BoostScoreGraph: () => <div data-testid="graph" />,
	Button: ( { children }: { children: ReactNode } ) => <button>{ children }</button>,
	Popover: ( { children, action }: { children: ReactNode; action: ReactNode } ) => (
		<div>
			{ children }
			{ action }
		</div>
	),
} ) );
jest.mock( '$features/upgrade-cta/interstitial-modal-cta', () => ( {
	__esModule: true,
	default: ( { customModalTrigger }: { customModalTrigger: ReactNode } ) => customModalTrigger,
} ) );

test.each( [
	{ online: true, myJetpack: true, visible: true },
	{ online: true, myJetpack: false, visible: false },
	{ online: false, myJetpack: false, visible: false },
] )( 'only offers a usable history upgrade (%o)', ( { online, myJetpack, visible } ) => {
	Object.assign( globalThis, { Jetpack_Boost: { site: { online, myJetpack } } } );
	render(
		<GraphComponent
			periods={ [] }
			annotations={ [] }
			startDate={ 0 }
			endDate={ 0 }
			needsUpgrade
			handleUpgrade={ jest.fn() }
			isFreshStart={ false }
			handleDismissFreshStart={ jest.fn() }
			isLoading={ false }
		/>
	);

	expect( screen.getByTestId( 'graph' ) ).toBeTruthy();
	expect(
		Boolean( screen.queryByText( 'Upgrade and learn more about your site performance over time.' ) )
	).toBe( visible );
	expect( Boolean( screen.queryByRole( 'button', { name: 'Upgrade now!' } ) ) ).toBe( visible );
} );
