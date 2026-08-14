import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SeoSchemaPanel from '../schema-panel';

// Isolate the presentational panel from its data HOC so we can drive it with
// plain props. `withSeoHelper` wires `metaValue`/`updateMetaValue` to the
// editor store, which is out of scope for this component's rendering logic.
jest.mock( '../with-seo-helper', () => ( {
	withSeoHelper: () => Component => Component,
} ) );

describe( 'SeoSchemaPanel', () => {
	const getSelect = () => screen.getByRole( 'combobox', { name: /schema type/i } );

	it( 'renders the Default / Article / FAQ options', () => {
		render( <SeoSchemaPanel metaValue="" updateMetaValue={ jest.fn() } /> );

		expect( getSelect() ).toBeInTheDocument();
		expect( screen.getByRole( 'option', { name: 'Default' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'option', { name: 'Article' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'option', { name: 'FAQ' } ) ).toBeInTheDocument();
	} );

	it( 'reflects the current meta value', () => {
		render( <SeoSchemaPanel metaValue="article" updateMetaValue={ jest.fn() } /> );

		expect( getSelect() ).toHaveValue( 'article' );
	} );

	it( 'falls back to the Default option when no value is set', () => {
		render( <SeoSchemaPanel metaValue={ undefined } updateMetaValue={ jest.fn() } /> );

		expect( getSelect() ).toHaveValue( '' );
	} );

	it( 'calls updateMetaValue with the chosen type', async () => {
		const updateMetaValue = jest.fn();
		render( <SeoSchemaPanel metaValue="" updateMetaValue={ updateMetaValue } /> );

		await userEvent.selectOptions( getSelect(), 'faq' );

		// SelectControl invokes onChange as ( value, { event } ); we only care
		// about the value the panel forwards to the meta updater.
		expect( updateMetaValue.mock.calls[ 0 ][ 0 ] ).toBe( 'faq' );
	} );
} );
