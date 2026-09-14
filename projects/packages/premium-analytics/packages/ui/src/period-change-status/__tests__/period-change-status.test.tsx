/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { render, screen, within } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { PeriodChangeStatus } from '../period-change-status';

const JULY_2026 = {
	from: new TZDate( 2026, 6, 1, 0, 0, 0, 0, 'UTC' ),
	to: new TZDate( 2026, 6, 31, 23, 59, 59, 999, 'UTC' ),
};
const AUGUST_2026 = {
	from: new TZDate( 2026, 7, 1, 0, 0, 0, 0, 'UTC' ),
	to: new TZDate( 2026, 7, 31, 23, 59, 59, 999, 'UTC' ),
};

const sentence = () => within( screen.getByRole( 'status' ) ).getByText( /Date range updated/ );

describe( 'PeriodChangeStatus', () => {
	it( 'mounts an empty status region before anything happens', () => {
		render( <PeriodChangeStatus appliedRange={ JULY_2026 } /> );

		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
	} );

	it( 'announces the applied period once the attention fires', () => {
		render( <PeriodChangeStatus attentionId={ 1 } appliedRange={ JULY_2026 } /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Date range updated to July 2026.' );
	} );

	it( 'inserts a new node for a repeat of the same sentence', () => {
		const view = render( <PeriodChangeStatus attentionId={ 1 } appliedRange={ JULY_2026 } /> );
		const first = sentence();

		view.rerender( <PeriodChangeStatus attentionId={ 2 } appliedRange={ JULY_2026 } /> );

		expect( sentence() ).toHaveTextContent( 'Date range updated to July 2026.' );
		expect( sentence() ).not.toBe( first );
	} );

	it( 'keeps the sentence it announced when the period is relabelled', () => {
		const view = render( <PeriodChangeStatus attentionId={ 1 } appliedRange={ JULY_2026 } /> );

		view.rerender( <PeriodChangeStatus attentionId={ 1 } appliedRange={ AUGUST_2026 } /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Date range updated to July 2026.' );
	} );

	it( 'names an applied preset the way the trigger does', () => {
		render(
			<PeriodChangeStatus
				attentionId={ 1 }
				appliedPresetId="last-30-days"
				appliedRange={ JULY_2026 }
			/>
		);

		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			'Date range updated to Last 30 days.'
		);
	} );

	it( 'empties the region when the attention is let go', () => {
		const view = render( <PeriodChangeStatus attentionId={ 1 } appliedRange={ JULY_2026 } /> );

		view.rerender( <PeriodChangeStatus appliedRange={ JULY_2026 } /> );

		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
	} );
} );
