import '@testing-library/jest-dom';
import { getScriptData } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '../product-card';
import type { ProductCamelCase } from '../../../../data/types';
import type { MyJetpackModule } from '../../../../types';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );

// Stands in for the action so a toggle in the header is easy to spot.
jest.mock( '../product-card-action', () => ( {
	ProductCardAction: () => <input type="checkbox" aria-label="Card action" readOnly />,
} ) );

const product = {
	slug: 'stats',
	name: 'Stats',
	description: 'See how many people visit your site.',
	isPluginActive: true,
} as unknown as ProductCamelCase;

describe( 'ProductCard', () => {
	beforeEach( () => {
		( getScriptData as jest.Mock ).mockReturnValue( { site: { is_multisite: false } } );
	} );

	it( 'keeps the header action for a module nobody forced', () => {
		const $module = { module: 'stats', available: true, activated: true } as MyJetpackModule;

		render( <ProductCard product={ product } module={ $module } /> );

		expect( screen.getByRole( 'checkbox', { name: 'Card action' } ) ).toBeInTheDocument();
	} );

	it( 'moves a forced module out of the header, below the description', () => {
		const $module = {
			module: 'stats',
			available: true,
			activated: true,
			override: 'active',
		} as MyJetpackModule;

		render( <ProductCard product={ product } module={ $module } /> );

		// Matches come back in document order, so the note has to follow the description.
		const order = screen
			.getAllByText( /See how many people visit your site\.|Enabled by your host/ )
			.map( el => el.textContent );

		expect( order ).toEqual( [
			'See how many people visit your site.',
			'Enabled by your host or site administrator',
		] );
		expect( screen.getByRole( 'heading', { name: 'Stats' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );
} );
