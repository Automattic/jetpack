/**
 * External dependencies
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
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
	let setFromOutside: ( attributes: ReportParamsFieldAttributes ) => void = () => {};

	function Host() {
		const [ attributes, setAttributes ] = useState( ATTRIBUTES );

		setFromOutside = setAttributes;

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

	return {
		saved,
		latest: () => saved[ saved.length - 1 ]?.reportParams,
		// Stands in for an undo, a dashboard reset, or another surface saving
		// the same widget — anything that writes the attribute past this control.
		setFromOutside: ( reportParams: ReportParamsFieldAttributes[ 'reportParams' ] ) =>
			act( () => setFromOutside( { reportParams } ) ),
	};
}

function openCustomRange( user: ReturnType< typeof userEvent.setup > ) {
	return user.click( screen.getByRole( 'button', { name: /custom/i } ) );
}

async function shortenRangeTo( days: number ) {
	const from = await screen.findByLabelText< HTMLInputElement >( 'From' );
	const to = screen.getByLabelText< HTMLInputElement >( 'To' );
	const end = new Date( `${ to.value }T00:00:00Z` );
	const start = new Date( end.getTime() - ( days - 1 ) * 24 * 60 * 60 * 1000 );

	/*
	 * `userEvent.type` cannot drive an `<input type="date">`: it types into the
	 * rendered segments, not the ISO value the control parses.
	 */
	// eslint-disable-next-line testing-library/prefer-user-event
	fireEvent.change( from, { target: { value: start.toISOString().slice( 0, 10 ) } } );
}

async function draftShortRange( user: ReturnType< typeof userEvent.setup >, days: number ) {
	await openCustomRange( user );
	await shortenRangeTo( days );
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

	it( 'leaves a custom range to its Apply step', async () => {
		const user = userEvent.setup();
		const { saved } = renderField( true );

		await user.click( screen.getByRole( 'button', { name: /custom/i } ) );

		expect( saved ).toHaveLength( 0 );
	} );

	it( 'keeps Apply disabled until the range actually changes', async () => {
		const user = userEvent.setup();
		renderField( true );

		await openCustomRange( user );

		await expect( screen.findByRole( 'button', { name: 'Apply' } ) ).resolves.toHaveAttribute(
			'aria-disabled',
			'true'
		);

		await shortenRangeTo( 3 );

		expect( screen.getByRole( 'button', { name: 'Apply' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	// The pills report what the widget is showing, so an un-applied draft must not
	// leave the row with nothing selected.
	it( 'keeps the applied preset selected while a custom range is drafted', async () => {
		const user = userEvent.setup();
		renderField( true );

		await draftShortRange( user, 3 );

		expect( screen.getByRole( 'button', { name: /30 days/i } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	} );

	/*
	 * Reading the options from the applied range while the checked value comes
	 * from the draft lets the menu offer a bucket the drafted range cannot hold:
	 * the click then resolves away, the tick springs back, and Apply drops the
	 * choice. Both must read the same range.
	 */
	it( 'reshapes the bucket menu with the range being drafted', async () => {
		const user = userEvent.setup();
		renderField( true );

		await draftShortRange( user, 3 );
		await user.click( screen.getByRole( 'button', { name: 'Chart interval' } ) );

		await expect(
			screen.findByRole( 'menuitemradio', { name: 'By hours' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitemradio', { name: 'By weeks' } ) ).not.toBeInTheDocument();
	} );

	it( 'holds a bucket picked mid-draft until Apply', async () => {
		const user = userEvent.setup();
		const { saved, latest } = renderField( true );

		await draftShortRange( user, 3 );
		await user.click( screen.getByRole( 'button', { name: 'Chart interval' } ) );
		await user.click( await screen.findByRole( 'menuitemradio', { name: 'By hours' } ) );

		expect( saved ).toHaveLength( 0 );

		await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

		expect( latest() ).toEqual( expect.objectContaining( { interval: 'hour' } ) );
	} );

	// The bucket rides along with an open range draft, so cancelling the draft has
	// to take it with them — and leave the control clean enough that the next
	// bucket click commits on its own again.
	it( 'drops a bucket picked mid-draft when the range draft is cancelled', async () => {
		const user = userEvent.setup();
		const { saved } = renderField( true );

		await draftShortRange( user, 3 );
		await user.click( screen.getByRole( 'button', { name: 'Chart interval' } ) );
		await user.click( await screen.findByRole( 'menuitemradio', { name: 'By hours' } ) );

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( saved ).toHaveLength( 0 );

		await user.click( screen.getByRole( 'button', { name: 'Chart interval' } ) );

		await expect(
			screen.findByRole( 'menuitemradio', { name: 'By weeks' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitemradio', { name: 'By hours' } ) ).not.toBeInTheDocument();

		await user.click( await screen.findByRole( 'menuitemradio', { name: 'By weeks' } ) );

		expect( saved ).toHaveLength( 1 );
	} );

	it( 'commits a comparison range on selection', async () => {
		const user = userEvent.setup();
		const { latest } = renderField();

		await user.click( screen.getByRole( 'button', { name: /compare/i } ) );
		await user.click( await screen.findByRole( 'menuitemradio', { name: 'Previous period' } ) );

		expect( latest() ).toEqual(
			expect.objectContaining( {
				comp: '1',
				compare_preset: 'previous-period',
				compare_from: expect.any( String ),
				compare_to: expect.any( String ),
			} )
		);
	} );

	// Committing the comparison on its own would apply the range draft with it.
	it( 'holds a comparison picked mid-draft until Apply', async () => {
		const user = userEvent.setup();
		const { saved, latest } = renderField();

		await draftShortRange( user, 3 );
		await user.click( screen.getByRole( 'button', { name: /compare/i } ) );
		await user.click( await screen.findByRole( 'menuitemradio', { name: 'Previous period' } ) );

		expect( saved ).toHaveLength( 0 );

		await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

		expect( latest() ).toEqual( expect.objectContaining( { compare_preset: 'previous-period' } ) );
	} );

	it( 'realigns the draft when the params change from outside', async () => {
		const user = userEvent.setup();
		const { setFromOutside } = renderField( true );

		// A 3-day draft offers hours; the seven days arriving from outside do not.
		await draftShortRange( user, 3 );
		await setFromOutside( { preset: 'last-7-days', interval: 'day' } );

		await user.click( screen.getByRole( 'button', { name: 'Chart interval' } ) );

		await expect(
			screen.findByRole( 'menuitemradio', { name: 'By days' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitemradio', { name: 'By hours' } ) ).not.toBeInTheDocument();
	} );
} );
