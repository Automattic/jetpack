/* No jest-dom in this project. */
/* eslint-disable jest-dom/prefer-in-document, testing-library/no-container, testing-library/no-node-access */
import { render, screen } from '@testing-library/react';
import Collapse from './collapse';

/* Springs and ResizeObserver are not available in jsdom, so both are replaced
   with synchronous stand-ins: the spring settles at once and reports it. */
jest.mock( 'react-use-measure', () => () => [ jest.fn(), { height: 80 } ] );
jest.mock( '@react-spring/web', () => ( {
	animated: { div: 'div' },
	useSpring: ( config: { height: number; onRest?: () => void } ) => {
		config.onRest?.();
		return { height: config.height };
	},
} ) );

describe( 'Collapse', () => {
	it( 'shows its content at the measured height while open', () => {
		const onCollapsed = jest.fn();
		const { container } = render(
			<Collapse className="wrap" contentClassName="inner" onCollapsed={ onCollapsed }>
				<p>content</p>
			</Collapse>
		);

		expect( screen.getByText( 'content' ) ).toBeTruthy();
		expect( container.querySelector( '.wrap' )?.getAttribute( 'style' ) ).toContain(
			'height: 80px'
		);
		expect( container.querySelector( '.wrap > .inner > p' ) ).not.toBeNull();
		expect( onCollapsed ).not.toHaveBeenCalled();
	} );

	it( 'collapses to zero and reports once closed', () => {
		const onCollapsed = jest.fn();
		const { container } = render(
			<Collapse open={ false } onCollapsed={ onCollapsed } style={ { marginTop: 24 } }>
				<p>content</p>
			</Collapse>
		);

		const style = container.firstElementChild?.getAttribute( 'style' ) ?? '';
		expect( style ).toContain( 'height: 0' );
		expect( style ).toContain( 'margin-top: 24px' );
		expect( onCollapsed ).toHaveBeenCalledTimes( 1 );
	} );
} );
