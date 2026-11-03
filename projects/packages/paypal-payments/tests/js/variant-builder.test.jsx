/**
 * Tests for the variants toggle and its option groups.
 *
 * Its controls live outside edit-api-managed.jsx, and a wrong toggle payload
 * deletes the merchant's option groups, so both payloads are asserted whole.
 *
 * @package
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VariantBuilder from '../../src/paypal-payment-buttons/components/variant-builder';

const groups = {
	dimensions: [
		{
			_key: 'd1',
			name: 'Size',
			primary: true,
			options: [
				{ _key: 'o1', label: 'Small' },
				{ _key: 'o2', label: 'Large' },
			],
		},
	],
};

/**
 * Render the builder and hand back the onChange spy.
 *
 * @param {object} props - Props to merge over the defaults.
 * @return {Function} The onChange mock.
 */
const mountBuilder = ( props = {} ) => {
	const changes = jest.fn();
	render(
		<VariantBuilder
			enabled={ true }
			variants={ groups }
			currencyCode="USD"
			onChange={ changes }
			{ ...props }
		/>
	);
	return changes;
};

describe( 'VariantBuilder', () => {
	it( 'clears the option groups when the toggle goes off', async () => {
		const user = userEvent.setup();
		const changes = mountBuilder();

		await user.click( screen.getByLabelText( 'Add variants' ) );

		expect( changes ).toHaveBeenCalledWith( { variantsEnabled: false, variants: null } );
	} );

	it( 'keeps the groups when the toggle goes back on', async () => {
		const user = userEvent.setup();
		const changes = mountBuilder( { enabled: false } );

		await user.click( screen.getByLabelText( 'Add variants' ) );

		expect( changes ).toHaveBeenCalledWith( { variantsEnabled: true } );
	} );

	it( 'adds the first group when the toggle goes on with none', async () => {
		const user = userEvent.setup();
		const changes = mountBuilder( { enabled: false, variants: null } );

		await user.click( screen.getByLabelText( 'Add variants' ) );

		const payload = changes.mock.calls[ 0 ][ 0 ];
		expect( payload.variantsEnabled ).toBe( true );
		expect( payload.variants.dimensions ).toHaveLength( 1 );
	} );
} );
