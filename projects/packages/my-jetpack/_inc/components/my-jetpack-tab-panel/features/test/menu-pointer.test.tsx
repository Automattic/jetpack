import { render, screen, act } from '@testing-library/react';
import { MenuPointer } from '../menu-pointer';
import type { MenuPointerTarget } from '../use-sidebar-sync';
import type { ReactNode } from 'react';

const mockUseMediaQuery = jest.fn();

jest.mock( '@wordpress/compose', () => ( {
	useMediaQuery: ( query: string ) => mockUseMediaQuery( query ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Popover: ( { children }: { children: ReactNode } ) => <div role="tooltip">{ children }</div>,
} ) );

/**
 * A sidebar holding one submenu item per page, and the links a dot would land in.
 *
 * @param pages - The submenu items to build.
 * @return Each item and its own link.
 */
const sidebar = ( ...pages: string[] ) => {
	const menu = document.createElement( 'ul' );
	const top = document.createElement( 'li' );
	const submenu = document.createElement( 'ul' );

	menu.id = 'adminmenu';
	top.className = 'menu-top';
	submenu.className = 'wp-submenu';

	const items = pages.map( slug => {
		const item = document.createElement( 'li' );
		const link = document.createElement( 'a' );

		link.href = `admin.php?page=${ slug }`;
		item.append( link );
		submenu.append( item );

		// jsdom reports an empty rect for everything, which is how the pointer tells a folded
		// sidebar from an open one. A painted item reports a rect.
		item.getClientRects = () => ( { length: 1 } ) as unknown as DOMRectList;

		return { item, link };
	} );

	top.append( submenu );
	menu.append( top );
	document.body.replaceChildren( menu );

	return items;
};

const target = ( elements: HTMLElement[], label: string ): MenuPointerTarget => ( {
	elements,
	label,
} );

describe( 'MenuPointer', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		mockUseMediaQuery.mockReturnValue( true );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'marks every new item and names them once', () => {
		const items = sidebar( 'stats', 'blaze' );

		render(
			<MenuPointer
				target={ target(
					items.map( ( { item } ) => item ),
					'2 features are now in your menu'
				) }
				onDismiss={ jest.fn() }
			/>
		);

		items.forEach( ( { link } ) => expect( link ).not.toBeEmptyDOMElement() );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( '2 features are now in your menu' );
	} );

	it( 'shows nothing where the sidebar is hidden', () => {
		mockUseMediaQuery.mockReturnValue( false );
		const [ stats ] = sidebar( 'stats' );

		render(
			<MenuPointer
				target={ target( [ stats.item ], 'STATS is now in your menu' ) }
				onDismiss={ jest.fn() }
			/>
		);

		expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
		expect( stats.link ).toBeEmptyDOMElement();
	} );

	it( 'goes away on its own', () => {
		const onDismiss = jest.fn();
		const [ stats ] = sidebar( 'stats' );

		render(
			<MenuPointer
				target={ target( [ stats.item ], 'STATS is now in your menu' ) }
				onDismiss={ onDismiss }
			/>
		);

		act( () => void jest.advanceTimersByTime( 5999 ) );
		expect( onDismiss ).not.toHaveBeenCalled();

		act( () => void jest.advanceTimersByTime( 1 ) );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'gives a second pointer its own full window', () => {
		const onDismiss = jest.fn();
		const [ stats, blaze ] = sidebar( 'stats', 'blaze' );
		const { rerender } = render(
			<MenuPointer
				target={ target( [ stats.item ], 'STATS is now in your menu' ) }
				onDismiss={ onDismiss }
			/>
		);

		act( () => void jest.advanceTimersByTime( 5000 ) );

		rerender(
			<MenuPointer
				target={ target( [ blaze.item ], 'BLAZE is now in your menu' ) }
				onDismiss={ onDismiss }
			/>
		);

		act( () => void jest.advanceTimersByTime( 5999 ) );
		expect( onDismiss ).not.toHaveBeenCalled();

		act( () => void jest.advanceTimersByTime( 1 ) );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
