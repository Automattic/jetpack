import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import useAnalytics from '../../../hooks/use-analytics';
import { CarouselSettings } from '../carousel';
import { CommentsSettings } from '../comments';
import { GoogleAnalyticsSettings } from '../google-analytics';
import { InfiniteScrollSettings } from '../infinite-scroll';
import { MarkdownSettings } from '../markdown';
import { PostByEmailSettings } from '../post-by-email';
import type { MyJetpackModule } from '../../../types';

const mockRecordEvent = jest.mocked( jest.mocked( useAnalytics )().recordEvent );

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
jest.mock( '../../my-jetpack-tab-panel/features/feature-state', () => ( {
	useAccountConnected: () => true,
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
			{ module: 'carousel', toggled: 'on', origin, event_version: 1 },
		],
		[
			'an option switched on',
			() => screen.getByRole( 'switch', { name: /Exif/ } ),
			'jetpack_wpa_settings_toggle',
			{
				module: 'carousel',
				setting: 'carousel_display_exif',
				toggled: 'on',
				origin,
				event_version: 1,
			},
		],
		[
			'an option switched off',
			() => screen.getByRole( 'switch', { name: /comments/ } ),
			'jetpack_wpa_settings_toggle',
			{
				module: 'carousel',
				setting: 'carousel_display_comments',
				toggled: 'off',
				origin,
				event_version: 1,
			},
		],
	] )( 'records %s under the old Settings event', async ( _name, control, event, props ) => {
		render( <CarouselSettings module={ $module } disabled={ false } /> );
		await userEvent.click( control() );

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith( event, props );
	} );

	it( 'records the chosen value of a select', async () => {
		render( <CarouselSettings module={ $module } disabled={ false } /> );
		await userEvent.click( screen.getByRole( 'combobox', { name: 'Carousel color scheme' } ) );
		await userEvent.click( await screen.findByRole( 'option', { name: 'White' } ) );

		expect( apiFetch ).toHaveBeenCalled();
		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_settings_change', {
			module: 'carousel',
			setting: 'carousel_background_color',
			origin,
			event_version: 1,
			value: 'white',
		} );
	} );

	const panel = ( module: string ) => ( { ...$module, module, options: {} } ) as MyJetpackModule;

	it.each( [
		[
			'Carousel',
			() => <CarouselSettings module={ panel( 'carousel' ) } disabled={ false } />,
			'carousel',
		],
		[
			'Comments',
			() => <CommentsSettings module={ panel( 'comments' ) } disabled={ false } />,
			'comments',
		],
		[ 'Google Analytics', () => <GoogleAnalyticsSettings />, 'google-analytics' ],
		[
			'Infinite Scroll',
			() => <InfiniteScrollSettings module={ panel( 'infinite-scroll' ) } disabled={ false } />,
			'infinite-scroll',
		],
		[
			'Markdown',
			() => <MarkdownSettings module={ panel( 'markdown' ) } disabled={ false } />,
			'markdown',
		],
		[
			'Post by Email',
			() => <PostByEmailSettings module={ panel( 'post-by-email' ) } disabled={ false } />,
			'post-by-email',
		],
	] )(
		'records the %s Learn more link as the old Settings screen did',
		async ( name, settings, feature ) => {
			render(
				<QueryClientProvider client={ new QueryClient() }>{ settings() }</QueryClientProvider>
			);
			await userEvent.click(
				await screen.findByRole( 'link', { name: new RegExp( `^Learn more about ${ name }` ) } )
			);

			expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_click', {
				target: 'learn-more',
				feature,
				origin,
				event_version: 1,
			} );
		}
	);
} );
