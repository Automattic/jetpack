/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { createReportParamsField, type ReportParamsFieldAttributes } from '../report-params-field';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';

// A 30-day window: `getAllowedIntervalsForPreset` offers day and week for it, so
// the bucket menu has something to switch between.
const ATTRIBUTES: ReportParamsFieldAttributes = {
	reportParams: { preset: 'last-30-days', interval: 'day' },
};

/*
 * Render the control the way the dashboard does: the edits it emits come back
 * as its data. A test holding `data` still would pass on a control that commits
 * a stale draft, because it never sees what the widget ends up with.
 */
function renderField( withIntervalControl?: boolean ) {
	const Field = createReportParamsField( { withIntervalControl } );
	const saved: ReportParamsFieldAttributes[] = [];

	function Host() {
		const [ attributes, setAttributes ] = useState( ATTRIBUTES );

		return (
			<Field
				{ ...( {
					data: attributes,
					onChange: ( edits: Partial< ReportParamsFieldAttributes > ) => {
						const next = { ...attributes, ...edits } as ReportParamsFieldAttributes;
						saved.push( next );
						setAttributes( next );
					},
				} as unknown as DataFormControlProps< ReportParamsFieldAttributes > ) }
			/>
		);
	}

	render( <Host /> );

	return { saved, latest: () => saved[ saved.length - 1 ]?.reportParams };
}

describe( 'createReportParamsField', () => {
	it( 'offers no bucket control by default', () => {
		renderField();

		expect( screen.queryByRole( 'button', { name: 'Chart interval' } ) ).not.toBeInTheDocument();
	} );

	it( 'offers the bucket control when asked for it', async () => {
		renderField( true );

		await expect(
			screen.findByRole( 'button', { name: 'Chart interval' } )
		).resolves.toBeInTheDocument();
	} );

	// The bucket applies on click, the way the preset pills do — there is no
	// Apply step for it while the range itself is unedited.
	it( 'saves a bucket change without an Apply step', async () => {
		const user = userEvent.setup();
		const { latest } = renderField( true );

		await user.click( await screen.findByRole( 'button', { name: 'Chart interval' } ) );
		await user.click( await screen.findByRole( 'menuitemradio', { name: 'By weeks' } ) );

		expect( latest() ).toEqual( expect.objectContaining( { interval: 'week' } ) );
	} );

	/*
	 * `DateRangeFilter` applies a quick preset by calling `onChange` and then
	 * `onApply` back to back in one tick. A commit reading the staged state
	 * writes the previous selection back over the new one, so the widget lands a
	 * click behind — and on the first click, on the range it already had, which
	 * is why picking "Last 24 hours" left months and quarters on offer.
	 */
	it( 'applies the clicked quick preset, not the one before it', async () => {
		const user = userEvent.setup();
		const { latest } = renderField( true );

		await user.click( screen.getByRole( 'button', { name: /24 hours/i } ) );

		expect( latest() ).toEqual( expect.objectContaining( { preset: 'last-24-hours' } ) );

		await user.click( screen.getByRole( 'button', { name: /7 days/i } ) );

		expect( latest() ).toEqual( expect.objectContaining( { preset: 'last-7-days' } ) );
	} );

	// The bucket menu reshapes with the applied range: a 24-hour window has only
	// hours to offer, where the 30-day window it replaced had days and weeks.
	it( 'reshapes the bucket menu once the preset applies', async () => {
		const user = userEvent.setup();
		renderField( true );

		await user.click( screen.getByRole( 'button', { name: /24 hours/i } ) );
		await user.click( await screen.findByRole( 'button', { name: 'Chart interval' } ) );

		await expect(
			screen.findByRole( 'menuitemradio', { name: 'By hours' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitemradio', { name: 'By days' } ) ).not.toBeInTheDocument();
	} );

	// A custom range is drafted in a popover and still has its own Apply, so it
	// must not commit through the same path.
	it( 'leaves a custom range to its Apply step', async () => {
		const user = userEvent.setup();
		const { saved } = renderField( true );

		await user.click( screen.getByRole( 'button', { name: /custom/i } ) );

		expect( saved ).toHaveLength( 0 );
	} );
} );
