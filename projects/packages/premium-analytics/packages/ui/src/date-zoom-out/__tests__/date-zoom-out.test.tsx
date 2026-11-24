import { TZDate } from '@date-fns/tz';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateZoomOut } from '../date-zoom-out';

const RANGE = {
	from: new TZDate( '2026-09-01T00:00:00.000+00:00', 'UTC' ),
	to: new TZDate( '2026-09-30T23:59:59.999+00:00', 'UTC' ),
};

describe( 'DateZoomOut', () => {
	it.each( [
		[ 'last-30-days', 'Zoom out to Last 30 days' ],
		[ 'custom', 'Zoom out to September 2026' ],
	] as const )( 'names the window it zooms out to: %s', async ( presetId, name ) => {
		const onZoomOut = jest.fn();
		const user = userEvent.setup();

		render( <DateZoomOut presetId={ presetId } range={ RANGE } onZoomOut={ onZoomOut } /> );

		await user.click( screen.getByRole( 'button', { name } ) );

		expect( onZoomOut ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'greys out while disabled', async () => {
		const onZoomOut = jest.fn();
		const user = userEvent.setup();

		render(
			<DateZoomOut presetId="last-30-days" range={ RANGE } disabled onZoomOut={ onZoomOut } />
		);

		const button = screen.getByRole( 'button', { name: 'Zoom out to Last 30 days' } );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( button );
		expect( onZoomOut ).not.toHaveBeenCalled();
	} );
} );
