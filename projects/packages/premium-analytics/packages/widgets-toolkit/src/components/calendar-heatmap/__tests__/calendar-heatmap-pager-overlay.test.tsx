/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { CalendarHeatmapPagerOverlay } from '../calendar-heatmap-pager-overlay';
import type { CalendarHeatmapPager } from '../calendar-heatmap-pager-overlay';

const pagerWith = ( state: Partial< CalendarHeatmapPager > ): CalendarHeatmapPager => ( {
	canShowOlder: true,
	canShowNewer: true,
	showOlder: jest.fn(),
	showNewer: jest.fn(),
	...state,
} );

const older = () => screen.queryByRole( 'button', { name: 'Older activity' } );
const newer = () => screen.queryByRole( 'button', { name: 'Newer activity' } );

describe( 'CalendarHeatmapPagerOverlay', () => {
	it( 'draws the chart with no arrows when there is no pager', () => {
		render( <CalendarHeatmapPagerOverlay>chart</CalendarHeatmapPagerOverlay> );

		expect( screen.getByText( 'chart' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'leaves out an arrow with nowhere to go and pages with the other', async () => {
		const user = userEvent.setup();
		const pager = pagerWith( { canShowNewer: false } );
		render( <CalendarHeatmapPagerOverlay pager={ pager }>chart</CalendarHeatmapPagerOverlay> );

		expect( newer() ).not.toBeInTheDocument();
		await user.click( older()! );

		expect( pager.showOlder ).toHaveBeenCalledTimes( 1 );
		expect( pager.showNewer ).not.toHaveBeenCalled();
	} );

	it.each( [
		{ pressed: 'older', gone: { canShowOlder: false }, survivor: newer },
		{ pressed: 'newer', gone: { canShowNewer: false }, survivor: older },
	] )(
		'hands focus to the other arrow when the pressed $pressed arrow runs out of pages',
		async ( { pressed, gone, survivor } ) => {
			const user = userEvent.setup();
			const { rerender } = render(
				<CalendarHeatmapPagerOverlay pager={ pagerWith( {} ) }>chart</CalendarHeatmapPagerOverlay>
			);

			await user.click( pressed === 'older' ? older()! : newer()! );
			rerender(
				<CalendarHeatmapPagerOverlay pager={ pagerWith( gone ) }>chart</CalendarHeatmapPagerOverlay>
			);

			expect( survivor() ).toHaveFocus();
		}
	);

	it( 'leaves focus alone when the arrows change while neither holds it', () => {
		const { rerender } = render(
			<CalendarHeatmapPagerOverlay pager={ pagerWith( {} ) }>
				<button type="button">cell</button>
			</CalendarHeatmapPagerOverlay>
		);

		screen.getByRole( 'button', { name: 'cell' } ).focus();
		rerender(
			<CalendarHeatmapPagerOverlay pager={ pagerWith( { canShowOlder: false } ) }>
				<button type="button">cell</button>
			</CalendarHeatmapPagerOverlay>
		);

		expect( screen.getByRole( 'button', { name: 'cell' } ) ).toHaveFocus();
	} );
} );
