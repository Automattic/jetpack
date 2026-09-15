import { TZDate } from '@date-fns/tz';
import { type DateRange } from '@jetpack-premium-analytics/datetime';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { DateRangePopoverContent } from '../date-range-filter';

const JULY_2026: DateRange = {
	from: new TZDate( 2026, 6, 1, 0, 0, 0, 0, 'UTC' ),
	to: new TZDate( 2026, 6, 31, 23, 59, 59, 999, 'UTC' ),
};

type Props = Parameters< typeof DateRangePopoverContent >[ 0 ];

// Mirrors the dropdown: a reported range comes back as the next `range` prop.
function Harness( { onChange, ...props }: Props ) {
	const [ range, setRange ] = useState( props.range );

	return (
		<DateRangePopoverContent
			{ ...props }
			range={ range }
			onChange={ ( nextRange, presetId ) => {
				if ( nextRange ) {
					setRange( nextRange );
				}
				onChange( nextRange, presetId );
			} }
		/>
	);
}

function renderContent( overrides: Partial< Props > = {} ) {
	const props: Props = {
		range: JULY_2026,
		onChange: jest.fn(),
		onApply: jest.fn(),
		onCancel: jest.fn(),
		canApply: true,
		timeZone: 'UTC',
		...overrides,
	};

	render( <Harness { ...props } /> );

	return props;
}

const day = ( dayOfMonth: number ) =>
	within( screen.getByRole( 'grid' ) ).getByRole( 'button', {
		name: new RegExp( `July ${ dayOfMonth }, 2026` ),
	} );

const isSelected = ( dayOfMonth: number ) => /selected/.test( day( dayOfMonth ).ariaLabel ?? '' );

describe( 'DateRangePopoverContent selection', () => {
	it( 'stages the first click without reporting a range', async () => {
		const user = userEvent.setup();
		const { onChange } = renderContent();

		await user.click( day( 10 ) );

		expect( onChange ).not.toHaveBeenCalled();
		expect( isSelected( 10 ) ).toBe( true );
		expect( isSelected( 1 ) ).toBe( false );
		expect( screen.getByRole( 'button', { name: 'Apply' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'reports the range on the second click, earlier day first', async () => {
		const user = userEvent.setup();
		const { onChange } = renderContent();

		await user.click( day( 10 ) );
		await user.click( day( 5 ) );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith(
			{ from: new Date( 2026, 6, 5 ), to: new Date( 2026, 6, 10 ) },
			'custom'
		);
		expect( isSelected( 5 ) && isSelected( 7 ) && isSelected( 10 ) ).toBe( true );
		expect( screen.getByRole( 'button', { name: 'Apply' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	// The calendar's own behaviour would move the nearest end of the range.
	it( 'starts a new range on the third click', async () => {
		const user = userEvent.setup();
		const { onChange } = renderContent();

		await user.click( day( 10 ) );
		await user.click( day( 20 ) );
		await user.click( day( 25 ) );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( isSelected( 25 ) ).toBe( true );
		expect( isSelected( 10 ) || isSelected( 20 ) ).toBe( false );
	} );

	// The calendar previews moving the nearest end of a complete range on hover,
	// which is not what a click does here, so that preview is hidden until a draft opens.
	it( 'only keeps the hover preview while a draft is open', async () => {
		const user = userEvent.setup();
		renderContent();
		const isRangeComplete = () =>
			screen.getByRole( 'application' ).classList.contains( 'date-range-calendar--range-complete' );

		expect( isRangeComplete() ).toBe( true );

		await user.click( day( 10 ) );
		expect( isRangeComplete() ).toBe( false );

		await user.click( day( 20 ) );
		expect( isRangeComplete() ).toBe( true );
	} );

	it( 'reports a single day when the same day is clicked twice', async () => {
		const user = userEvent.setup();
		const { onChange } = renderContent();

		await user.click( day( 10 ) );
		await user.click( day( 10 ) );

		expect( onChange ).toHaveBeenCalledWith(
			{ from: new Date( 2026, 6, 10 ), to: new Date( 2026, 6, 10 ) },
			'custom'
		);
	} );
} );
