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
} );
