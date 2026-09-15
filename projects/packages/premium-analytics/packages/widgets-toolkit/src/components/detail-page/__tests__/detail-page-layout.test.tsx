/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import {
	DetailPageLayout,
	DetailPageSection,
	useDetailPageScrollToTop,
} from '../detail-page-layout';

// The gutter, the widget grid's gap and the Card padding overrides all hang off
// these classes; the shared style stub would leave every one of them undefined.
jest.mock( '../detail-page-layout.module.scss', () => ( {
	root: 'root',
	section: 'section',
} ) );

function ScrollToTopButton() {
	const scrollToTop = useDetailPageScrollToTop();

	return (
		<button type="button" onClick={ scrollToTop }>
			Back to top
		</button>
	);
}

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

	it( 'brings its scroll area back to the top for a card that asks', async () => {
		// jsdom has no Element.scrollTo; the scroll area is what must move.
		const scrollTo = jest.fn();
		HTMLElement.prototype.scrollTo = scrollTo;
		const user = userEvent.setup();
		render(
			<DetailPageLayout header={ { title: 'Launch recap' } }>
				<ScrollToTopButton />
			</DetailPageLayout>
		);

		await user.click( screen.getByRole( 'button', { name: 'Back to top' } ) );

		expect( scrollTo ).toHaveBeenCalledTimes( 1 );
		expect( scrollTo ).toHaveBeenCalledWith( expect.objectContaining( { top: 0 } ) );
		expect( scrollTo.mock.instances[ 0 ] ).toHaveClass( 'root' );
		Reflect.deleteProperty( HTMLElement.prototype, 'scrollTo' );
	} );

	it( 'hands a card outside any detail page a scroll that does nothing', async () => {
		const user = userEvent.setup();
		render( <ScrollToTopButton /> );

		await expect(
			user.click( screen.getByRole( 'button', { name: 'Back to top' } ) )
		).resolves.toBeUndefined();
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
