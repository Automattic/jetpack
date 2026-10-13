/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { useReducedMotion } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { DetailPageLayout, DetailPageSection } from '../detail-page-layout';
import { DetailPageShell } from '../detail-page-shell';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useReducedMotion: jest.fn( () => false ),
} ) );

// The layout's gutters and the shell's scroll model hang off these classes. Every
// stylesheet maps to the one style stub, so this mock serves the shell's too.
jest.mock( '../detail-page-layout.module.scss', () => ( {
	root: 'root',
	section: 'section',
	page: 'page',
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( { className, children }: { className?: string; children?: ReactNode } ) => (
		<div data-testid="page" className={ className }>
			{ children }
		</div>
	),
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

	it( 'leaves the header out when a page state stands in for the resource', () => {
		render( <DetailPageLayout tabs={ <div role="tablist" /> }>not sent</DetailPageLayout> );

		expect( screen.queryByRole( 'heading', { level: 2 } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'not sent' ) ).toBeInTheDocument();
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
			jest.mocked( useReducedMotion ).mockReturnValueOnce( true );

			render(
				<DetailPageLayout header={ { title: 'Launch recap' } } returnToTopKey={ 1 }>
					widgets
				</DetailPageLayout>
			);

			expect( scrollTo ).toHaveBeenCalledWith( { top: 0, behavior: 'auto' } );
		} );
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

describe( 'DetailPageShell', () => {
	it( 'lets its own child own the scroll, and keeps the caller class', () => {
		render( <DetailPageShell className="custom-page">body</DetailPageShell> );

		expect( screen.getByTestId( 'page' ) ).toHaveClass( 'page', 'custom-page' );
		expect( screen.getByText( 'body' ) ).toBeInTheDocument();
	} );
} );
