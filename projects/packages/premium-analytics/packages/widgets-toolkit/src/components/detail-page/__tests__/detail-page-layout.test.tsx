/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { DetailPageLayout, DetailPageSection } from '../detail-page-layout';

// The gutter, the widget grid's gap and the Card padding overrides all hang off
// these classes; the shared style stub would leave every one of them undefined.
jest.mock( '../detail-page-layout.module.scss', () => ( {
	root: 'root',
	section: 'section',
} ) );

describe( 'DetailPageLayout', () => {
	it( 'heads the page with the resource title and subtitle', () => {
		render(
			<DetailPageLayout header={ { title: 'Launch recap', subTitle: 'Video published today.' } }>
				widgets
			</DetailPageLayout>
		);

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent( 'Launch recap' );
		expect( screen.getByText( 'Video published today.' ) ).toBeInTheDocument();
	} );

	it( 'renders the date controls it is given', () => {
		render(
			<DetailPageLayout
				header={ { title: 'Launch recap' } }
				controls={ <div data-testid="date-filters-panel" /> }
			>
				widgets
			</DetailPageLayout>
		);

		expect( screen.getByTestId( 'date-filters-panel' ) ).toBeInTheDocument();
	} );

	it( 'renders the tabs above the header, inside the scroll area', () => {
		render(
			<DetailPageLayout header={ { title: 'Launch recap' } } tabs={ <div role="tablist" /> }>
				widgets
			</DetailPageLayout>
		);

		const heading = screen.getByRole( 'heading', { level: 2 } );

		// Order in the scroll area is what this test is for.
		expect( screen.getByRole( 'tablist' ).compareDocumentPosition( heading ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );

	it( 'renders no controls when given none', () => {
		render( <DetailPageLayout header={ { title: 'Launch recap' } }>widgets</DetailPageLayout> );

		expect( screen.queryByTestId( 'date-filters-panel' ) ).not.toBeInTheDocument();
	} );

	it( 'stacks the sections under the header', () => {
		render(
			<DetailPageLayout header={ { title: 'Launch recap' } }>
				<DetailPageSection>widgets</DetailPageSection>
				<DetailPageSection>notice</DetailPageSection>
			</DetailPageLayout>
		);

		expect( screen.getByText( 'widgets' ) ).toBeInTheDocument();
		expect( screen.getByText( 'notice' ) ).toBeInTheDocument();
	} );

	it( 'gutters every section, and the caller can add to it', () => {
		render(
			<DetailPageLayout header={ { title: 'Launch recap' } }>
				<DetailPageSection>widgets</DetailPageSection>
				<DetailPageSection className="custom-band">notice</DetailPageSection>
			</DetailPageLayout>
		);

		expect( screen.getByText( 'widgets' ) ).toHaveClass( 'section' );
		expect( screen.getByText( 'notice' ) ).toHaveClass( 'section', 'custom-band' );
	} );
} );
