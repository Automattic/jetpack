import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Composite } from '@wordpress/components';
import { DateRangeQuickPresets } from '../date-range-quick-presets';
import type { ComponentProps } from 'react';

function renderPresets(
	props: Partial< Omit< ComponentProps< typeof DateRangeQuickPresets >, 'onSelect' > > = {}
) {
	const onSelect = jest.fn();

	// Non-compact pills render as Composite items; mirror the group that
	// DateRangeFilter provides in product.
	render(
		<Composite role="toolbar" aria-label="Date range">
			<DateRangeQuickPresets value={ null } timeZone="UTC" { ...props } onSelect={ onSelect } />
		</Composite>
	);

	return { onSelect };
}

describe( 'DateRangeQuickPresets', () => {
	it( 'renders the quick presets with the active preset pressed', () => {
		renderPresets( { value: 'last-7-days' } );

		expect( screen.getAllByRole( 'button' ) ).toHaveLength( 4 );
		expect( screen.getByRole( 'button', { name: 'Last 7 days' } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Last 24 hours' } ) ).toHaveAttribute(
			'aria-pressed',
			'false'
		);
	} );

	it( 'leaves every preset unpressed when a custom range is active', () => {
		renderPresets( { value: null } );

		screen.getAllByRole( 'button' ).forEach( button => {
			expect( button ).toHaveAttribute( 'aria-pressed', 'false' );
		} );
	} );

	it( 'selects a preset with a freshly computed rolling range', async () => {
		const user = userEvent.setup();
		const { onSelect } = renderPresets();

		await user.click( screen.getByRole( 'button', { name: 'Last 24 hours' } ) );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		const [ range, id ] = onSelect.mock.calls[ 0 ];
		expect( id ).toBe( 'last-24-hours' );
		expect( range.to.getTime() - range.from.getTime() ).toBe( 24 * 60 * 60 * 1000 );
	} );

	it( 'renders every preset in a select when compact', () => {
		render(
			<DateRangeQuickPresets isCompact value="today" onSelect={ jest.fn() } timeZone="UTC" />
		);

		expect( screen.queryAllByRole( 'button' ) ).toHaveLength( 0 );
		expect( screen.getByRole( 'combobox', { name: 'Period' } ) ).toBeInTheDocument();
	} );
} );
