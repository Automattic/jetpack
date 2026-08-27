/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { WidgetMetricSelect } from '../widget-metric-select';

const ITEMS = [
	{ label: 'Total views', value: 'total' },
	{ label: 'Average per day', value: 'average' },
];

/**
 * jsdom has no layout to position the popup against, so its open transition
 * never resolves and it can still carry `pointer-events: none` when a click
 * lands. That says nothing about the control in a browser.
 *
 * @return A user session that can click through the popup.
 */
const selectUser = () => userEvent.setup( { pointerEventsCheck: PointerEventsCheckLevel.Never } );

/**
 * The select driven by state, as a widget drives it.
 *
 * @param props          - Test props.
 * @param props.onChange - Notified with each selected value.
 * @return The controlled select.
 */
function ControlledSelect( { onChange }: { onChange?: ( value: string ) => void } ) {
	const [ value, setValue ] = useState( 'total' );

	return (
		<WidgetMetricSelect
			items={ ITEMS }
			value={ value }
			label="Views metric"
			onChange={ next => {
				setValue( next );
				onChange?.( next );
			} }
		/>
	);
}

describe( 'WidgetMetricSelect', () => {
	it( 'names itself for assistive tech without showing the label', () => {
		render( <ControlledSelect /> );

		const trigger = screen.getByRole( 'combobox', { name: 'Views metric' } );
		// The name reaches assistive tech; the trigger shows the selection instead.
		expect( trigger ).toHaveTextContent( 'Total views' );
		expect( trigger ).not.toHaveTextContent( 'Views metric' );
	} );

	it( 'reports the selection and shows it on the trigger', async () => {
		const onChange = jest.fn();
		const user = selectUser();
		render( <ControlledSelect onChange={ onChange } /> );

		const trigger = screen.getByRole( 'combobox', { name: 'Views metric' } );
		expect( trigger ).toHaveTextContent( 'Total views' );

		await user.click( trigger );
		await user.click( screen.getByRole( 'option', { name: 'Average per day', hidden: true } ) );

		expect( onChange ).toHaveBeenCalledWith( 'average' );
		expect( trigger ).toHaveTextContent( 'Average per day' );
	} );

	it( 'closes on selection instead of reopening on the portaled option click', async () => {
		const user = selectUser();
		render( <ControlledSelect /> );

		await user.click( screen.getByRole( 'combobox', { name: 'Views metric' } ) );
		await user.click( screen.getByRole( 'option', { name: 'Average per day', hidden: true } ) );

		// React bubbles the portaled option's click back through the wrapper, so
		// without the containment guard the wrapper would reopen what it just closed.
		expect( screen.getByRole( 'combobox', { name: 'Views metric' } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	} );

	it( 'keeps pointer-down from reaching the tile that would start a drag', async () => {
		const onDragStart = jest.fn();
		const user = selectUser();

		render(
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div onPointerDown={ onDragStart } onMouseDown={ onDragStart }>
				<ControlledSelect />
			</div>
		);

		await user.click( screen.getByRole( 'combobox', { name: 'Views metric' } ) );

		expect( onDragStart ).not.toHaveBeenCalled();
	} );

	it( 'falls back to the first item when the value matches none', () => {
		render(
			<WidgetMetricSelect
				items={ ITEMS }
				value="not-a-metric"
				label="Views metric"
				onChange={ jest.fn() }
			/>
		);

		expect( screen.getByRole( 'combobox', { name: 'Views metric' } ) ).toHaveTextContent(
			'Total views'
		);
	} );
} );
