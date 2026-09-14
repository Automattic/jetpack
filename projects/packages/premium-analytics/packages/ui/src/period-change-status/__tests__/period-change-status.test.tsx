/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { act, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { PeriodChangeStatus } from '../period-change-status';

const JULY_2026 = {
	from: new TZDate( 2026, 6, 1, 0, 0, 0, 0, 'UTC' ),
	to: new TZDate( 2026, 6, 31, 23, 59, 59, 999, 'UTC' ),
};

describe( 'PeriodChangeStatus', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	// A live region only announces changes made after it exists.
	it( 'mounts an empty status region before anything happens', () => {
		render( <PeriodChangeStatus appliedRange={ JULY_2026 } /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '' );
	} );

	it( 'announces the applied period once the attention fires', () => {
		render( <PeriodChangeStatus attentionId={ 1 } appliedRange={ JULY_2026 } /> );

		act( () => {
			jest.runOnlyPendingTimers();
		} );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Date range updated to July 2026.' );
	} );

	// Same text twice is no change to a live region, so the sentence is
	// cleared and written back in separate updates.
	it( 'clears before announcing again so a repeat is read out', () => {
		const view = render( <PeriodChangeStatus attentionId={ 1 } appliedRange={ JULY_2026 } /> );
		act( () => {
			jest.runOnlyPendingTimers();
		} );

		view.rerender( <PeriodChangeStatus attentionId={ 2 } appliedRange={ JULY_2026 } /> );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '' );

		act( () => {
			jest.runOnlyPendingTimers();
		} );
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

		act( () => {
			jest.runOnlyPendingTimers();
		} );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			'Date range updated to Last 30 days.'
		);
	} );

	it( 'says nothing when the attention is let go', () => {
		const view = render( <PeriodChangeStatus attentionId={ 1 } appliedRange={ JULY_2026 } /> );
		act( () => {
			jest.runOnlyPendingTimers();
		} );

		view.rerender( <PeriodChangeStatus appliedRange={ JULY_2026 } /> );
		act( () => {
			jest.runOnlyPendingTimers();
		} );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Date range updated to July 2026.' );
	} );
} );
