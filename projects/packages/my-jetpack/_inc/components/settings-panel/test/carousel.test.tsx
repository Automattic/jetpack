import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { CarouselSettings } from '../carousel';
import type { MyJetpackModule } from '../../../types';

const mockFetchModules = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockCreateSuccessNotice = jest.fn();

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		fetchModules: mockFetchModules,
		createErrorNotice: mockCreateErrorNotice,
		createSuccessNotice: mockCreateSuccessNotice,
	} ),
} ) );
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );
jest.mock( '../../module-toggle', () => ( {
	ModuleToggle: ( { labelledby, disabled }: { labelledby?: string; disabled?: boolean } ) => (
		<input type="checkbox" aria-labelledby={ labelledby } disabled={ disabled } />
	),
} ) );

const colorOption = {
	enum: [ 'black', 'white' ],
	enum_labels: { black: 'Black', white: 'White' },
	current_value: 'black',
};

const build = ( overrides: Partial< MyJetpackModule > = {} ) =>
	( {
		module: 'carousel',
		name: 'Carousel',
		activated: true,
		override: false,
		options: {
			carousel_display_exif: { current_value: false },
			carousel_display_comments: { current_value: true },
			carousel_background_color: colorOption,
		},
		...overrides,
	} ) as unknown as MyJetpackModule;

beforeEach( () => {
	jest.clearAllMocks();
	( apiFetch as unknown as jest.Mock ).mockResolvedValue( {} );
} );

describe( 'CarouselSettings', () => {
	it( 'shows the stored values, with the colour choices Jetpack sends', () => {
		render( <CarouselSettings module={ build() } disabled={ false } /> );

		expect(
			screen.getByRole( 'checkbox', { name: 'Display images in a full-screen carousel gallery' } )
		).toBeEnabled();
		expect( screen.getByRole( 'switch', { name: /Exif/ } ) ).not.toBeChecked();
		expect( screen.getByRole( 'switch', { name: /comments/ } ) ).toBeChecked();
		expect( screen.getByRole( 'combobox', { name: 'Carousel color scheme' } ) ).toHaveTextContent(
			'Black'
		);
	} );

	it( 'saves a new colour scheme as its string value', async () => {
		render( <CarouselSettings module={ build() } disabled={ false } /> );
		await userEvent.click( screen.getByRole( 'combobox', { name: 'Carousel color scheme' } ) );
		await userEvent.click( await screen.findByRole( 'option', { name: 'White' } ) );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/settings',
			method: 'POST',
			data: { carousel_background_color: 'white' },
		} );
		await waitFor( () => expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 ) );
	} );

	it.each( [
		[ 'the module is off', { activated: false }, false ],
		[ 'the site cannot use it', {}, true ],
	] )( 'locks every option when %s', ( _name, overrides, disabled ) => {
		render( <CarouselSettings module={ build( overrides ) } disabled={ disabled } /> );

		expect( screen.getByRole( 'switch', { name: /Exif/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'switch', { name: /comments/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'combobox', { name: 'Carousel color scheme' } ) ).toBeDisabled();
	} );

	it( 'locks the module switch when the site cannot use it', () => {
		render( <CarouselSettings module={ build() } disabled /> );

		expect(
			screen.getByRole( 'checkbox', { name: 'Display images in a full-screen carousel gallery' } )
		).toBeDisabled();
	} );

	it( 'leaves out the colour scheme when Jetpack sends no choices for it', () => {
		render( <CarouselSettings module={ build( { options: [] } ) } disabled={ false } /> );

		expect( screen.queryByRole( 'combobox' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'switch', { name: /Exif/ } ) ).not.toBeChecked();
	} );
} );
