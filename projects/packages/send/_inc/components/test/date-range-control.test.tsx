import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSettings, setSettings } from '@wordpress/date';
import { PERIOD_PRESETS } from '../../data/period';
import DateRangeControl from '../date-range-control';
import type { Period } from '../../data/types';
import type { ComponentProps } from 'react';

const TODAY = '2026-10-19';

const renderControl = ( props: Partial< ComponentProps< typeof DateRangeControl > > = {} ) => {
	const onChange = jest.fn();
	render(
		<DateRangeControl
			value={ { range: 90 } }
			onChange={ onChange }
			presets={ PERIOD_PRESETS }
			earliest="2026-10-05"
			today={ TODAY }
			{ ...props }
		/>
	);
	return { onChange, user: userEvent.setup() };
};

const open = async ( user: ReturnType< typeof userEvent.setup > ) => {
	await user.click( screen.getByRole( 'button', { name: /^Date range:/ } ) );
	return screen.findByRole( 'dialog' );
};

const isDisabled = ( button: HTMLElement ) => button.getAttribute( 'aria-disabled' ) === 'true';

const day = ( label: RegExp ) => screen.getByRole( 'button', { name: label } );

describe( 'DateRangeControl', () => {
	it( 'names the period on its button', () => {
		renderControl( { value: { start: '2025-12-01', end: '2026-01-15' } } );
		expect(
			screen.getByRole( 'button', { name: 'Date range: Dec 1, 2025 – Jan 15, 2026' } )
		).toBeVisible();
	} );

	it( 'offers Any date first, presses the current choice and focuses it', async () => {
		const { user } = renderControl( { value: { range: 7 }, allowAny: true } );
		const dialog = await open( user );
		const presets = within( within( dialog ).getByRole( 'group', { name: 'Quick ranges' } ) )
			.getAllByRole( 'button' )
			.map( button => [ button.textContent, button.getAttribute( 'aria-pressed' ) ] );
		expect( presets ).toEqual( [
			[ 'Any date', 'false' ],
			[ 'Last 24 hours', 'false' ],
			[ 'Last 7 days', 'true' ],
			[ 'Last 30 days', 'false' ],
			[ 'Last 90 days', 'false' ],
			[ 'Last 180 days', 'false' ],
			[ 'Last 365 days', 'false' ],
		] );
		expect( within( dialog ).getByRole( 'button', { name: 'Last 7 days' } ) ).toHaveFocus();
	} );

	it.each< [ string, Period | null ] >( [
		[ 'Last 30 days', { range: 30 } ],
		[ 'Any date', null ],
	] )( 'applies “%s” at once and closes', async ( label, period ) => {
		const { user, onChange } = renderControl( { allowAny: true } );
		await user.click( within( await open( user ) ).getByRole( 'button', { name: label } ) );
		expect( onChange ).toHaveBeenCalledWith( period );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'applies custom days only on Apply, once both days are picked', async () => {
		const { user, onChange } = renderControl( { value: null, allowAny: true } );
		const dialog = await open( user );
		const apply = within( dialog ).getByRole( 'button', { name: 'Apply' } );
		expect( isDisabled( apply ) ).toBe( true );
		expect( dialog ).toHaveTextContent( 'Pick a start date' );

		await user.click( day( /October 6, 2026/ ) );
		expect( isDisabled( apply ) ).toBe( true );
		expect( dialog ).toHaveTextContent( 'Pick an end date' );

		await user.click( day( /October 10, 2026/ ) );
		expect( dialog ).toHaveTextContent( 'Oct 6 – Oct 10 · 5 days' );
		expect( isDisabled( apply ) ).toBe( false );
		expect( onChange ).not.toHaveBeenCalled();

		await user.click( apply );
		expect( onChange ).toHaveBeenCalledWith( { start: '2026-10-06', end: '2026-10-10' } );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps a preset when its own days are applied unchanged', async () => {
		const { user, onChange } = renderControl( { value: { range: 7 } } );
		await user.click( within( await open( user ) ).getByRole( 'button', { name: 'Apply' } ) );
		expect( onChange ).toHaveBeenCalledWith( { range: 7 } );
	} );

	it( 'opens the last 24 hours with nothing picked, so Apply can’t turn it into custom days', async () => {
		const { user } = renderControl( { value: { range: 1 } } );
		const apply = within( await open( user ) ).getByRole( 'button', { name: 'Apply' } );
		expect( isDisabled( apply ) ).toBe( true );
	} );

	it.each( [ 'Cancel', 'Escape' ] )( 'changes nothing on %s', async how => {
		const { user, onChange } = renderControl();
		const dialog = await open( user );
		await user.click( day( /October 6, 2026/ ) );
		if ( how === 'Cancel' ) {
			await user.click( within( dialog ).getByRole( 'button', { name: 'Cancel' } ) );
		} else {
			await user.keyboard( '{Escape}' );
		}
		expect( onChange ).not.toHaveBeenCalled();
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Date range: Last 90 days' } ) ).toHaveFocus();
	} );

	it( 'disables days before the first one the screen has and after today', async () => {
		const { user } = renderControl();
		await open( user );
		expect( day( /October 4, 2026/ ) ).toBeDisabled();
		expect( day( /October 5, 2026/ ) ).toBeEnabled();
		expect( day( /October 20, 2026/ ) ).toBeDisabled();
	} );

	it( 'won’t apply custom days longer than the cap', async () => {
		const { user } = renderControl( {
			value: { start: '2025-09-01', end: TODAY },
			earliest: '2024-09-01',
			maxDays: 365,
		} );
		const dialog = await open( user );
		expect( dialog ).toHaveTextContent( 'Pick a range of 365 days or less.' );
		expect( isDisabled( within( dialog ).getByRole( 'button', { name: 'Apply' } ) ) ).toBe( true );
	} );

	it( 'shows the calendar in the site’s language and week', async () => {
		const settings = getSettings();
		setSettings( { ...settings, l10n: { ...settings.l10n, locale: 'fr_FR', startOfWeek: 1 } } );
		try {
			const { user } = renderControl();
			const dialog = await open( user );
			const october = within( dialog ).getByRole( 'grid', { name: /octobre 2026/i } );
			// The weekday row is hidden from assistive tech, hence `hidden`.
			const [ firstWeekday ] = within( october ).getAllByRole( 'columnheader', { hidden: true } );
			expect( firstWeekday ).toHaveAttribute( 'aria-label', expect.stringMatching( /lundi/i ) );
		} finally {
			setSettings( settings );
		}
	} );
} );
