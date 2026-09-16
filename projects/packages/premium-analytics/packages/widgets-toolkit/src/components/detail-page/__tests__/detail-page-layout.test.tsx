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

	describe( 'returnToTopKey', () => {
		// jsdom has no Element.scrollTo; the scroll area is what must move.
		const scrollTo = jest.fn();

		beforeEach( () => {
			scrollTo.mockReset();
			HTMLElement.prototype.scrollTo = scrollTo;
		} );

		afterEach( () => {
			Reflect.deleteProperty( HTMLElement.prototype, 'scrollTo' );
		} );

		it( 'leaves the page alone until a key arrives', () => {
			const { rerender } = render(
				<DetailPageLayout header={ { title: 'Launch recap' } }>widgets</DetailPageLayout>
			);
			expect( scrollTo ).not.toHaveBeenCalled();

			rerender(
				<DetailPageLayout header={ { title: 'Launch recap' } } returnToTopKey={ 1 }>
					widgets
				</DetailPageLayout>
			);

			expect( scrollTo ).toHaveBeenCalledTimes( 1 );
			expect( scrollTo ).toHaveBeenCalledWith( expect.objectContaining( { top: 0 } ) );
			expect( scrollTo.mock.instances[ 0 ] ).toHaveClass( 'root' );
		} );

		it( 'parks focus on the heading, where the next Tab reaches the controls', () => {
			render(
				<DetailPageLayout
					header={ { title: 'Launch recap' } }
					controls={ <button>Period</button> }
					returnToTopKey={ 1 }
				>
					<button>A card</button>
				</DetailPageLayout>
			);

			expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveFocus();
		} );

		it( 'returns again for each new key, not for the key going away', () => {
			const { rerender } = render(
				<DetailPageLayout header={ { title: 'Launch recap' } } returnToTopKey={ 1 }>
					widgets
				</DetailPageLayout>
			);
			rerender( <DetailPageLayout header={ { title: 'Launch recap' } }>widgets</DetailPageLayout> );
			expect( scrollTo ).toHaveBeenCalledTimes( 1 );

			rerender(
				<DetailPageLayout header={ { title: 'Launch recap' } } returnToTopKey={ 2 }>
					widgets
				</DetailPageLayout>
			);
			expect( scrollTo ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'jumps instead of gliding when the reader asked for less motion', () => {
			const matchMedia = window.matchMedia;
			window.matchMedia = jest.fn( () => ( { matches: true } ) ) as unknown as typeof matchMedia;

			render(
				<DetailPageLayout header={ { title: 'Launch recap' } } returnToTopKey={ 1 }>
					widgets
				</DetailPageLayout>
			);

			expect( scrollTo ).toHaveBeenCalledWith( { top: 0, behavior: 'auto' } );
			window.matchMedia = matchMedia;
		} );
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
