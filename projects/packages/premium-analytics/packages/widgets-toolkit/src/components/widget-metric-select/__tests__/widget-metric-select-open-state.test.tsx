/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { WidgetMetricSelect } from '../widget-metric-select';

type OpenChange = ( open: boolean, details?: { reason?: string } ) => void;

let lastOnOpenChange: OpenChange | undefined;
let lastOpen: boolean | undefined;

// The real select's open state is driven by `@base-ui`, whose popup jsdom
// cannot lay out — and the close this component exists to ignore comes from
// the dashboard's drag wrapper, which no jsdom gesture reproduces. Standing the
// select in for a recorder puts the wiring itself under test: which closes this
// component honours, and which it drops.
jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );

	return {
		...actual,
		SelectControl: ( { open, onOpenChange }: { open: boolean; onOpenChange: OpenChange } ) => {
			lastOnOpenChange = onOpenChange;
			lastOpen = open;
			return <div data-testid="select" data-open={ String( open ) } />;
		},
	};
} );

const ITEMS = [
	{ label: 'Total views', value: 'total' },
	{ label: 'Average per day', value: 'average' },
];

const renderSelect = () =>
	render(
		<WidgetMetricSelect items={ ITEMS } value="total" label="Views metric" onChange={ jest.fn() } />
	);

const isOpen = () => screen.getByTestId( 'select' ).getAttribute( 'data-open' );

/**
 * Clicks the trigger. The click bubbles to the gesture-guard wrapper, which is
 * what actually opens the select — the same path a real click takes.
 */
const clickTrigger = () => userEvent.click( screen.getByTestId( 'select' ) );

/** Drives an open-state change the way the real select reports one. */
const reportOpenChange = ( open: boolean, reason: string ) => {
	act( () => lastOnOpenChange?.( open, { reason } ) );
};

describe( 'WidgetMetricSelect open state', () => {
	beforeEach( () => {
		lastOnOpenChange = undefined;
		lastOpen = undefined;
	} );

	it( 'starts closed and opens when the trigger is clicked', async () => {
		renderSelect();

		expect( isOpen() ).toBe( 'false' );

		await clickTrigger();

		expect( isOpen() ).toBe( 'true' );
	} );

	it( "ignores the drag wrapper's focus-churn close", async () => {
		renderSelect();
		await clickTrigger();
		expect( isOpen() ).toBe( 'true' );

		// The dashboard's focusable sortable wrapper closes the popup with no
		// reason the instant it opens. Honouring it would make the select
		// unopenable inside a tile.
		reportOpenChange( false, 'none' );

		expect( isOpen() ).toBe( 'true' );
	} );

	it( 'honours a close the reader actually asked for', async () => {
		renderSelect();
		await clickTrigger();

		reportOpenChange( false, 'outside-press' );

		expect( isOpen() ).toBe( 'false' );
		expect( lastOpen ).toBe( false );
	} );
} );
