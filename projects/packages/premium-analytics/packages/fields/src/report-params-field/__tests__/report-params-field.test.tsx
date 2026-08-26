/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function renderField( withIntervalControl?: boolean ) {
	const onChange = jest.fn();
	const Field = createReportParamsField( { withIntervalControl } );

	render(
		<Field
			{ ...( {
				data: ATTRIBUTES,
				onChange,
			} as unknown as DataFormControlProps< ReportParamsFieldAttributes > ) }
		/>
	);

	return { onChange };
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
		const { onChange } = renderField( true );

		await user.click( await screen.findByRole( 'button', { name: 'Chart interval' } ) );
		await user.click( await screen.findByRole( 'menuitemradio', { name: 'By weeks' } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			reportParams: expect.objectContaining( { interval: 'week' } ),
		} );
	} );

	/*
	 * The dashboard header's pills apply on click, because `useStagedSearch`
	 * auto-commits them. Without the same here the pill highlights while the
	 * widget keeps fetching the committed range — and the bucket menu keeps
	 * offering that range's buckets, so picking "Last 24 hours" left months and
	 * quarters on offer.
	 */
	it( 'applies a quick preset on click, with no Apply step', async () => {
		const user = userEvent.setup();
		const { onChange } = renderField( true );

		await user.click( screen.getByRole( 'button', { name: /24 hours/i } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			reportParams: expect.objectContaining( { preset: 'last-24-hours' } ),
		} );
	} );

	// A custom range is drafted in a popover and still has its own Apply, so it
	// must not commit through the same path.
	it( 'leaves a custom range to its Apply step', async () => {
		const user = userEvent.setup();
		const { onChange } = renderField( true );

		await user.click( screen.getByRole( 'button', { name: /custom/i } ) );

		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
