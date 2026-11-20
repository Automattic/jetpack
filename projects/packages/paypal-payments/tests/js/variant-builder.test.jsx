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

// The option image opens the media modal, which is the browser's business.
jest.mock( '@wordpress/block-editor', () => ( {
	MediaUploadCheck: ( { children } ) => children,
	MediaUpload: ( { render: renderButton } ) => renderButton( { open: () => {} } ),
} ) );

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

describe( 'option images', () => {
	const unpriced = ( first, second ) => ( {
		dimensions: [
			{ _key: 'd1', name: 'Color', primary: first, options: [ { _key: 'o1', label: 'Red' } ] },
			{ _key: 'd2', name: 'Size', primary: second, options: [ { _key: 'o2', label: 'S' } ] },
		],
	} );

	// PayPal takes option images on the group it prices, which is the first when none is.
	it( 'offers an image on the first group only when no group is priced', () => {
		mountBuilder( { variants: unpriced( false, false ) } );

		expect( screen.getByRole( 'button', { name: 'Add image to Red' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Add image to S' } ) ).not.toBeInTheDocument();
	} );

	it( 'offers an image on the priced group when that is not the first', () => {
		mountBuilder( { variants: unpriced( false, true ) } );

		expect( screen.queryByRole( 'button', { name: 'Add image to Red' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Add image to S' } ) ).toBeInTheDocument();
	} );

	it( 'writes an option without its image into the group', async () => {
		const user = userEvent.setup();
		const variants = unpriced( false, false );
		variants.dimensions[ 0 ].options[ 0 ].images = [
			{ assetId: 'asset-9', name: 'red.jpg', status: 'APPROVED' },
		];
		const changes = mountBuilder( { variants } );

		await user.click( screen.getByRole( 'button', { name: 'Remove red.jpg from Red' } ) );

		expect( changes ).toHaveBeenCalledWith( {
			variants: {
				dimensions: [
					{ ...variants.dimensions[ 0 ], options: [ { _key: 'o1', label: 'Red', images: [] } ] },
					variants.dimensions[ 1 ],
				],
			},
		} );
	} );
} );
