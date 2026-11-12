import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { CarouselSettings } from '../carousel';
import type { MyJetpackModule } from '../../../types';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );
jest.mock( '@automattic/jetpack-connection', () => ( {
	useConnection: () => ( {} ),
} ) );
jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		fetchModules: jest.fn(),
		createErrorNotice: jest.fn(),
		createSuccessNotice: jest.fn(),
	} ),
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
	},
} as unknown as MyJetpackModule;

let connectionState: typeof window.JP_CONNECTION_INITIAL_STATE;

beforeEach( () => {
	( apiFetch as unknown as jest.Mock ).mockResolvedValue( {} );
	connectionState = window.JP_CONNECTION_INITIAL_STATE;
	delete window.JP_CONNECTION_INITIAL_STATE;
	window.myJetpackInitialState = { isOfflineFeatures: true } as typeof window.myJetpackInitialState;
} );

afterEach( () => {
	window.JP_CONNECTION_INITIAL_STATE = connectionState;
	window.myJetpackInitialState = {} as typeof window.myJetpackInitialState;
} );

describe( 'Settings panel in offline mode', () => {
	it( 'renders and switches without the connection state', async () => {
		render( <CarouselSettings module={ $module } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Module switch' } ) );
		await userEvent.click( screen.getByRole( 'switch', { name: /Exif/ } ) );

		expect( apiFetch ).toHaveBeenCalled();
	} );
} );
