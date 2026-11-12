/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import 'jetpack-js-tools/jest/setup-jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SubpageFrame from './subpage-frame';
import BoostPage from '../../../../../../_inc/components/boost-page';
import type { MouseEvent, ReactNode } from 'react';

const mockBackToSettings = jest.fn( ( event: MouseEvent ) => event.preventDefault() );

beforeEach( () => {
	mockBackToSettings.mockClear();
	Object.assign( window, { Jetpack_Boost: { site: { myJetpack: true } } } );
} );
jest.mock( '$lib/navigation/use-back-to-settings', () => ( {
	useBackToSettings: () => ( {
		href: '?page=jetpack-boost&p=%2F%3Ftab%3Dsettings',
		onClick: mockBackToSettings,
	} ),
} ) );

jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { breadcrumbs, children }: { breadcrumbs: ReactNode; children: ReactNode } ) => (
		<main>
			{ breadcrumbs }
			{ children }
		</main>
	),
} ) );

describe( 'SubpageFrame', () => {
	it( 'renders the breadcrumb header above the content', () => {
		const { container } = render(
			<SubpageFrame title="Cache debug log">
				<p>content</p>
			</SubpageFrame>
		);

		const header = screen.getByRole( 'banner' );
		expect( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) ).toBeInTheDocument();
		expect( header.querySelector( 'svg' ) ).toBeInTheDocument();
		expect( header.nextElementSibling ).toHaveTextContent( 'content' );
		expect( container.querySelector( '.jb-dashboard' ) ).not.toBeInTheDocument();
	} );

	it( 'updates the current breadcrumb after dismissing overflow and changing subpages', async () => {
		// JSDOM needs geometry to exercise the real breadcrumb's responsive overflow.
		const geometry = jest
			.spyOn( HTMLElement.prototype, 'getBoundingClientRect' )
			.mockImplementation( function ( this: HTMLElement ) {
				return {
					width: this.tagName === 'OL' ? 320 : 100,
					height: 20,
					top: 0,
					left: 0,
					right: 100,
					bottom: 20,
					x: 0,
					y: 0,
					toJSON: () => ( {} ),
				};
			} );
		const originalResizeObserver = global.ResizeObserver;
		global.ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
		try {
			const { rerender } = render( <SubpageFrame title="Cache debug log">Cache</SubpageFrame> );
			const trigger = screen.getByRole( 'button', { name: /hidden breadcrumb/ } );
			act( () => trigger.focus() );
			// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
			fireEvent.click( trigger );
			const menuItem = await screen.findByRole( 'menuitem', { name: 'Jetpack' } );
			// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
			fireEvent.keyDown( menuItem, { key: 'Escape', code: 'Escape' } );
			await waitFor( () => expect( trigger ).toHaveFocus() );
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
			rerender( <SubpageFrame title="Critical CSS recommendations">Critical CSS</SubpageFrame> );
			expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent(
				'Critical CSS recommendations'
			);
			expect(
				screen.getByText( 'Critical CSS recommendations', { selector: '[aria-current="page"]' } )
			).toBeInTheDocument();
		} finally {
			geometry.mockRestore();
			global.ResizeObserver = originalResizeObserver;
		}
	} );

	it.each( [ true, false ] )(
		'renders one trail and heading with My Jetpack available: %s',
		myJetpack => {
			const title = 'Cache debug log';
			Object.assign( window, {
				wpApiSettings: { root: '/wp-json/', nonce: 'test' },
				Jetpack_Boost: { site: { myJetpack } },
			} );
			render(
				<BoostPage isSubpage subpage={ <SubpageFrame title={ title }>content</SubpageFrame> }>
					dashboard
				</BoostPage>
			);
			expect( screen.getAllByRole( 'navigation', { name: 'Breadcrumbs' } ) ).toHaveLength( 1 );
			expect( screen.getAllByRole( 'heading', { level: 1, hidden: true } ) ).toHaveLength( 1 );
			expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( title );
			expect( screen.queryAllByRole( 'link', { name: 'Jetpack' } ) ).toHaveLength(
				myJetpack ? 1 : 0
			);
			expect( screen.getByRole( 'link', { name: 'Boost' } ) ).toHaveAttribute(
				'href',
				'?page=jetpack-boost&p=%2F%3Ftab%3Dsettings'
			);
			expect(
				screen.getByText( title, { selector: '[aria-current="page"]' } )
			).toBeInTheDocument();
			// eslint-disable-next-line testing-library/prefer-user-event -- This project does not provide user-event.
			fireEvent.click( screen.getByRole( 'link', { name: 'Boost' } ) );
			expect( mockBackToSettings ).toHaveBeenCalledTimes( 1 );
		}
	);
} );
