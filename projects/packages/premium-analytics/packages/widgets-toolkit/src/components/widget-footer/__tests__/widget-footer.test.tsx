/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { WidgetFooter } from '../widget-footer';

jest.mock( '../widget-footer.module.scss', () => ( { footer: 'footer' } ) );

describe( 'WidgetFooter', () => {
	it( 'renders children in the footer container and merges a class name', () => {
		render(
			<WidgetFooter className="custom-footer">
				<span>Footer content</span>
			</WidgetFooter>
		);

		// eslint-disable-next-line testing-library/no-node-access -- The layout-only div has no semantic query target, so inspect the child's wrapper directly.
		const footer = screen.getByText( 'Footer content' ).parentElement;
		expect( footer ).toHaveClass( 'footer', 'custom-footer' );
	} );
} );
