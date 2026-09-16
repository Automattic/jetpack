/**
 * Tests for the variants toggle and its option groups.
 *
 * The one gate whose controls live outside edit-api-managed.jsx, and the one where
 * getting the payload wrong deletes the merchant's option groups rather than
 * resetting a scalar. Both payloads are asserted whole.
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
	it( 'takes the groups with it when the toggle goes off', async () => {
		const user = userEvent.setup();
		const changes = mountBuilder();

		await user.click( screen.getByLabelText( 'Add variants' ) );

		expect( changes ).toHaveBeenCalledWith( { variantsEnabled: false, variants: null } );
	} );

	// Switching on has to keep what is already there. Folding this case into the
	// off-branch turned the toggle into a delete button.
	it( 'keeps the groups when the toggle goes back on', async () => {
		const user = userEvent.setup();
		const changes = mountBuilder( { enabled: false } );

		await user.click( screen.getByLabelText( 'Add variants' ) );

		expect( changes ).toHaveBeenCalledWith( { variantsEnabled: true } );
	} );

	it( 'seeds one group when the toggle goes on with none', async () => {
		const user = userEvent.setup();
		const changes = mountBuilder( { enabled: false, variants: null } );

		await user.click( screen.getByLabelText( 'Add variants' ) );

		const payload = changes.mock.calls[ 0 ][ 0 ];
		expect( payload.variantsEnabled ).toBe( true );
		expect( payload.variants.dimensions ).toHaveLength( 1 );
	} );
} );
