import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { CarouselSettings } from '../carousel';
import type { MyJetpackModule } from '../../../types';

const mockRecordEvent = jest.fn();

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		fetchModules: jest.fn(),
		createErrorNotice: jest.fn(),
		createSuccessNotice: jest.fn(),
	} ),
} ) );
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: mockRecordEvent } ),
} ) );
jest.mock( '../../module-toggle', () => ( {
	ModuleToggle: ( { onSwitch }: { onSwitch?: ( active: boolean ) => void } ) => (
		<button onClick={ onSwitch?.bind( null, true ) }>Module switch</button>
	),
} ) );

const $module = {
	module: 'carousel',
	name: 'Carousel',
	activated: true,
	override: false,
	options: {
		carousel_display_exif: { current_value: false },
		carousel_display_comments: { current_value: true },
		carousel_background_color: {
			enum: [ 'black', 'white' ],
			enum_labels: { black: 'Black', white: 'White' },
			current_value: 'black',
		},
	},
} as unknown as MyJetpackModule;

const origin = 'my-jetpack-settings-panel';

beforeEach( () => {
	jest.clearAllMocks();
	( apiFetch as unknown as jest.Mock ).mockResolvedValue( {} );
} );

describe( 'Settings panel tracking', () => {
	it.each( [
		[
			'the module switch',
			() => screen.getByRole( 'button', { name: 'Module switch' } ),
			'jetpack_wpa_module_toggle',
			{ module: 'carousel', toggled: 'on', origin },
		],
		[
			'an option switched on',
			() => screen.getByRole( 'switch', { name: /Exif/ } ),
			'jetpack_wpa_settings_toggle',
			{ module: 'carousel', setting: 'carousel_display_exif', toggled: 'on', origin },
		],
		[
			'an option switched off',
			() => screen.getByRole( 'switch', { name: /comments/ } ),
			'jetpack_wpa_settings_toggle',
			{ module: 'carousel', setting: 'carousel_display_comments', toggled: 'off', origin },
		],
	] )( 'records %s under the old Settings event', async ( _name, control, event, props ) => {
		render( <CarouselSettings module={ $module } disabled={ false } /> );
		await userEvent.click( control() );

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith( event, props );
	} );

	it( 'records nothing for a select', async () => {
		render( <CarouselSettings module={ $module } disabled={ false } /> );
		await userEvent.click( screen.getByRole( 'combobox', { name: 'Carousel color scheme' } ) );
		await userEvent.click( await screen.findByRole( 'option', { name: 'White' } ) );

		expect( apiFetch ).toHaveBeenCalled();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );
} );
