import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import SiteVerificationCard from '../site-verification-card';
import type { SiteVerification } from '../../../data/overview-types';

/**
 * Build a verification payload with nothing verified.
 *
 * @param overrides - Services to mark verified.
 * @return The verification payload.
 */
const buildVerification = ( overrides: Partial< SiteVerification > = {} ): SiteVerification => ( {
	google: false,
	bing: false,
	pinterest: false,
	yandex: false,
	facebook: false,
	...overrides,
} );

describe( 'SiteVerificationCard', () => {
	it( 'lists only the globally-relevant services when nothing else is verified', () => {
		render( <SiteVerificationCard data={ buildVerification() } active onManage={ jest.fn() } /> );

		for ( const label of [ 'Google', 'Bing', 'Facebook' ] ) {
			expect( screen.getByText( label ) ).toBeInTheDocument();
		}
		// Rows most sites will never use don't pad out the summary.
		expect( screen.queryByText( 'Pinterest' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Yandex' ) ).not.toBeInTheDocument();
	} );

	it.each( [ [ 'pinterest', 'Pinterest' ] as const, [ 'yandex', 'Yandex' ] as const ] )(
		'still lists %s when the site has verified with it',
		( key, label ) => {
			// Any single service completes verification, so hiding one that IS set would
			// show a verified site as unverified while Settings reports it Complete.
			render(
				<SiteVerificationCard
					data={ buildVerification( { [ key ]: true } ) }
					active
					onManage={ jest.fn() }
				/>
			);

			expect( screen.getByText( label ) ).toBeInTheDocument();
			expect( screen.getByText( 'Set' ) ).toBeInTheDocument();
		}
	);

	it( 'keeps the hidden services hidden when only a primary one is verified', () => {
		render(
			<SiteVerificationCard
				data={ buildVerification( { google: true } ) }
				active
				onManage={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'Set' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Pinterest' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Yandex' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the shared display order when an extra service is shown', () => {
		render(
			<SiteVerificationCard
				data={ buildVerification( { yandex: true } ) }
				active
				onManage={ jest.fn() }
			/>
		);

		// VERIFICATION_SERVICES order is google, bing, pinterest, yandex, facebook —
		// so Yandex slots in before Facebook rather than being appended.
		const labels = screen
			.getAllByText( /^(Google|Bing|Pinterest|Yandex|Facebook)$/ )
			.map( node => node.textContent );
		expect( labels ).toEqual( [ 'Google', 'Bing', 'Yandex', 'Facebook' ] );
	} );

	it( 'does not describe saved codes as emitted while the module is inactive', () => {
		render(
			<SiteVerificationCard
				data={ buildVerification( { google: true } ) }
				active={ false }
				onManage={ jest.fn() }
			/>
		);

		expect( screen.getAllByText( 'Disabled' ) ).toHaveLength( 3 );
		expect( screen.queryByText( 'Set' ) ).not.toBeInTheDocument();
	} );

	it( 'shows configured status while the module is active', () => {
		render(
			<SiteVerificationCard
				data={ buildVerification( { google: true } ) }
				active
				onManage={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'Set' ) ).toBeInTheDocument();
		expect( screen.getAllByText( 'Not set' ) ).toHaveLength( 2 );
	} );
} );
