/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import ArrayCheckboxField from '../array-checkbox-field';
import type { DataFormControlProps, Option } from '@jetpack-premium-analytics/externals';

type MetricsAttributes = { metrics?: string[] };

const ELEMENTS: Option[] = [
	{ value: 'orders', label: 'Orders' },
	{ value: 'visitors', label: 'Visitors' },
];

function renderField( getElements: () => Promise< Option[] > ) {
	const field = {
		id: 'metrics',
		label: 'Metrics',
		elements: ELEMENTS,
		getElements,
		getValue: ( { item }: { item: MetricsAttributes } ) => item.metrics ?? [],
		setValue: ( { value }: { value: unknown } ) => ( { metrics: value } ),
		isDisabled: () => false,
	} as unknown as DataFormControlProps< MetricsAttributes >[ 'field' ];

	render(
		<ArrayCheckboxField
			data={ { metrics: [ 'orders' ] } }
			field={ field }
			onChange={ jest.fn() }
			hideLabelFromVision
		/>
	);
}

describe( 'ArrayCheckboxField', () => {
	it( 'lists an option registered after the field mounted once the menu opens again', async () => {
		const user = userEvent.setup();
		let offered = ELEMENTS;
		renderField( () => Promise.resolve( offered ) );

		const trigger = await screen.findByRole( 'button', { name: 'Metrics' } );
		await user.click( trigger );
		await expect(
			screen.findByRole( 'menuitemcheckbox', { name: 'Orders' } )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'menuitemcheckbox', { name: 'Bookings' } )
		).not.toBeInTheDocument();
		await user.keyboard( '{Escape}' );

		offered = [ ...ELEMENTS, { value: 'bookings', label: 'Bookings' } ];
		await user.click( trigger );

		await expect(
			screen.findByRole( 'menuitemcheckbox', { name: 'Bookings' } )
		).resolves.toBeInTheDocument();
	} );
} );
