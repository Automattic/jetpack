/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { DetailPageLayout } from '../detail-page/detail-page-layout';
import { ReportPageLayout } from '../report-page/report-page-layout';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/externals' ),
	JetpackFooter: () => <footer>Jetpack footer</footer>,
} ) );

function ReportLayout( { children }: { children: ReactNode } ) {
	return <ReportPageLayout title="Posts">{ children }</ReportPageLayout>;
}

describe.each( [
	[ 'DetailPageLayout', DetailPageLayout ],
	[ 'ReportPageLayout', ReportLayout ],
] )( '%s', ( _name, Layout ) => {
	it( 'ends its scroll area with the Jetpack footer', () => {
		render(
			<Layout>
				<p>content</p>
			</Layout>
		);

		expect(
			screen.getByText( 'content' ).compareDocumentPosition( screen.getByText( 'Jetpack footer' ) )
		).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );
} );
