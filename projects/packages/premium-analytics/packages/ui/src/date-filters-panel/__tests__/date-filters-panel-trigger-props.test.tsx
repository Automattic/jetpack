import { TZDate } from '@date-fns/tz';
import { render, screen } from '@testing-library/react';
import { DateFiltersPanel } from '../date-filters-panel';
import type { ComponentProps } from 'react';

// The stylesheets are stubbed, so the look a trigger was given is read off the
// props it received rather than off classes the Button never gets.
jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );
	const { createElement, forwardRef } = jest.requireActual( 'react' );
	const recordLook = ( Component: unknown ) =>
		forwardRef( ( { variant, tone, size, ...props }: Record< string, unknown >, ref: unknown ) =>
			createElement( Component, {
				...props,
				ref,
				'data-variant': variant,
				'data-tone': tone,
				'data-size': size,
			} )
		);

	return {
		...actual,
		Button: recordLook( actual.Button ),
		IconButton: recordLook( actual.IconButton ),
	};
} );

const TRIGGER_NAMES = [ 'Last 30 days', 'Compare', 'Chart interval: By days' ];

function renderPanel( props: Partial< ComponentProps< typeof DateFiltersPanel > > = {} ) {
	return render(
		<DateFiltersPanel
			range={ {
				from: new TZDate( '2026-07-01T00:00:00.000Z', 'UTC' ),
				to: new TZDate( '2026-07-30T23:59:59.999Z', 'UTC' ),
			} }
			appliedPresetId="last-30-days"
			withIntervalControl
			intervalOptions={ [ 'day', 'week' ] }
			interval="day"
			onIntervalChange={ jest.fn() }
			onChange={ jest.fn() }
			onComparisonChange={ jest.fn() }
			onApply={ jest.fn() }
			onCancel={ jest.fn() }
			timeZone="UTC"
			{ ...props }
		/>
	);
}

describe( 'DateFiltersPanel trigger props', () => {
	it( 'draws every trigger as a neutral outline at the default size', () => {
		renderPanel();

		for ( const name of TRIGGER_NAMES ) {
			const trigger = screen.getByRole( 'button', { name } );
			expect( trigger ).toHaveAttribute( 'data-variant', 'outline' );
			expect( trigger ).toHaveAttribute( 'data-tone', 'neutral' );
			expect( trigger ).not.toHaveAttribute( 'data-size' );
		}
	} );

	it( 'hands every trigger the surface look over the defaults', () => {
		renderPanel( { triggerProps: { size: 'compact' } } );

		for ( const name of TRIGGER_NAMES ) {
			const trigger = screen.getByRole( 'button', { name } );
			expect( trigger ).toHaveAttribute( 'data-variant', 'outline' );
			expect( trigger ).toHaveAttribute( 'data-size', 'compact' );
		}
	} );
} );
