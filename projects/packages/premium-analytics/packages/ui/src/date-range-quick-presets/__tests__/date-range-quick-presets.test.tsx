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

	// However narrow the surface gets, the presets stay a row of pills: there is
	// no mode that hides the choice behind a menu.
	it( 'never collapses the presets into a select', () => {
		renderPresets( { labelMode: 'abbreviated' } );

		expect( screen.queryByRole( 'combobox' ) ).not.toBeInTheDocument();
		expect( screen.getAllByRole( 'button' ) ).toHaveLength( 4 );
	} );

	it( 'shortens the visible labels when abbreviated', () => {
		renderPresets( { labelMode: 'abbreviated' } );

		expect( screen.getAllByRole( 'button' ).map( button => button.textContent ) ).toEqual( [
			'24H',
			'7D',
			'30D',
			'12M',
		] );
	} );

	/*
	 * The abbreviations drop the wording that named the period, so the accessible
	 * name has to keep it. Querying by the full name is the assertion: it only
	 * resolves through the aria-label, since the visible text is "7D".
	 */
	it( 'keeps the full label as the accessible name when abbreviated', () => {
		renderPresets( { labelMode: 'abbreviated', value: 'last-7-days' } );

		expect( screen.getByRole( 'button', { name: 'Last 7 days' } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	} );

	it( 'leaves the accessible name alone when labels are full', () => {
		renderPresets( { labelMode: 'full' } );

		expect( screen.getByRole( 'button', { name: 'Last 7 days' } ) ).not.toHaveAttribute(
			'aria-label'
		);
	} );
} );
