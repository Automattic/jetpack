/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportPageLayout } from '../report-page/report-page-layout';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/externals' ),
	JetpackFooter: () => <footer>Jetpack footer</footer>,
} ) );

function ReportLayout( { children }: { children: ReactNode } ) {
	return <ReportPageLayout title="Posts">{ children }</ReportPageLayout>;
}

describe.each( [ [ 'ReportPageLayout', ReportLayout ] ] )( '%s', ( _name, Layout ) => {
	it( 'ends its scroll area with the Jetpack footer', () => {
		const { container } = render(
			<Layout>
				<p>content</p>
			</Layout>
		);

		// eslint-disable-next-line testing-library/no-node-access -- Which element ends the scroll root is the assertion.
		expect( container.firstElementChild?.lastElementChild ).toBe(
			screen.getByText( 'Jetpack footer' )
		);
	} );
} );
