/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { WidgetPeriodLabel } from '../widget-period-label';

jest.mock( '../widget-period-label.module.scss', () => ( { periodLabel: 'periodLabel' } ) );

describe( 'WidgetPeriodLabel', () => {
	it( 'renders the period as text and merges a class name', () => {
		render( <WidgetPeriodLabel label="Last 7 days" className="custom-period" /> );

		expect( screen.getByText( 'Last 7 days' ) ).toHaveClass( 'periodLabel', 'custom-period' );
	} );
} );
