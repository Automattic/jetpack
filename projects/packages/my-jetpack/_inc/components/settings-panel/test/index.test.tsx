import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPanel } from '../index';
import { moduleSettings } from '../registry';
import type { MyJetpackModule } from '../../../types';

const mockNavigate = jest.fn();
let mockSearch: Record< string, unknown > = {};
let mockModules: { modules: Record< string, MyJetpackModule >; hasLoaded: boolean };

jest.mock( '@wordpress/route', () => ( { useNavigate: () => mockNavigate } ) );
jest.mock( '../../../router-bridge', () => ( { useRouteSearch: () => mockSearch } ) );
jest.mock( '../../my-jetpack-tab-panel/features/use-all-jetpack-modules', () => ( {
	useAllJetpackModules: () => mockModules,
} ) );
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );
jest.mock( '../../module-toggle', () => ( {
	ModuleToggle: ( {
		module: $module,
		labelledby,
		disabled,
	}: {
		module: MyJetpackModule;
		labelledby?: string;
		disabled?: boolean;
	} ) => (
		<input
			type="checkbox"
			aria-label={ labelledby ? undefined : `Toggle ${ $module.name }` }
			aria-labelledby={ labelledby }
			disabled={ disabled }
		/>
	),
} ) );

const tiledGallery = {
	module: 'tiled-gallery',
	name: 'Tiled Galleries',
	description: 'Show images in a slideshow.',
	configure_url: 'https://example.com/settings',
} as MyJetpackModule;
const likes = {
	module: 'likes',
	name: 'Likes',
	description: 'Let readers like posts.',
} as MyJetpackModule;

beforeEach( () => {
	jest.clearAllMocks();
	mockSearch = { configure: 'tiled-gallery', view: 'list' };
	mockModules = { modules: { 'tiled-gallery': tiledGallery, likes }, hasLoaded: true };
} );

afterEach( () => {
	delete moduleSettings[ 'tiled-gallery' ];
} );

describe( 'SettingsPanel', () => {
	it( 'shows the fallback for a module with no settings of its own', () => {
		render( <SettingsPanel /> );

		expect( screen.getByRole( 'heading', { name: 'Tiled Galleries' } ) ).toHaveFocus();
		expect( screen.getByText( tiledGallery.description ) ).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: 'Activate this feature' } ) ).toBeEnabled();
		expect( screen.getByRole( 'link', { name: 'Manage in Settings' } ) ).toHaveAttribute(
			'href',
			tiledGallery.configure_url
		);
	} );

	it( 'leaves out the Settings link for a module with no configure URL', () => {
		mockSearch = { configure: 'likes' };
		render( <SettingsPanel /> );

		expect( screen.queryByRole( 'link', { name: 'Manage in Settings' } ) ).not.toBeInTheDocument();
	} );

	it( 'shows a registered component in place of the fallback', () => {
		moduleSettings[ 'tiled-gallery' ] = ( { module: $module } ) => (
			<p>Options of { $module.name }</p>
		);
		render( <SettingsPanel /> );

		expect( screen.getByText( 'Options of Tiled Galleries' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Manage in Settings' } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'the fallback', 'Activate this feature', false ],
		[ 'a registered component', 'Show captions', true ],
	] )( 'locks %s for a module the site cannot use, and says why', ( _name, label, registered ) => {
		if ( registered ) {
			moduleSettings[ 'tiled-gallery' ] = ( { disabled } ) => (
				<input type="checkbox" aria-label="Show captions" disabled={ disabled } />
			);
		}
		mockModules = {
			modules: {
				'tiled-gallery': {
					...tiledGallery,
					available: false,
					unavailable_reason: 'Unavailable in Offline Mode',
				},
			},
			hasLoaded: true,
		};
		render( <SettingsPanel /> );

		expect( screen.getByText( 'Unavailable in Offline Mode' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: label } ) ).toBeDisabled();
	} );

	it( 'says the host forced a module on, and leaves its options unlocked', () => {
		mockModules = {
			modules: { 'tiled-gallery': { ...tiledGallery, override: 'active' } },
			hasLoaded: true,
		};
		moduleSettings[ 'tiled-gallery' ] = ( { disabled } ) => (
			<input type="checkbox" aria-label="Show captions" disabled={ disabled } />
		);
		render( <SettingsPanel /> );

		expect( screen.getByRole( 'checkbox', { name: 'Show captions' } ) ).toBeEnabled();
		expect( screen.getByText( 'Enabled by your host or site administrator' ) ).toBeInTheDocument();
	} );

	it( 'returns focus to what opened it on close', () => {
		render( <button type="button">Configure</button> );
		screen.getByRole( 'button', { name: 'Configure' } ).focus();
		const { unmount } = render( <SettingsPanel /> );
		unmount();

		expect( screen.getByRole( 'button', { name: 'Configure' } ) ).toHaveFocus();
	} );

	it( 'leaves focus alone on close when it is already somewhere else', () => {
		render(
			<>
				<button type="button">Configure</button>
				<input aria-label="Search" />
			</>
		);
		screen.getByRole( 'button', { name: 'Configure' } ).focus();
		const { unmount } = render( <SettingsPanel /> );
		screen.getByRole( 'textbox', { name: 'Search' } ).focus();
		unmount();

		expect( screen.getByRole( 'textbox', { name: 'Search' } ) ).toHaveFocus();
	} );

	it( 'swaps the content when another slug opens', () => {
		const { rerender } = render( <SettingsPanel /> );
		mockSearch = { configure: 'likes' };
		rerender( <SettingsPanel /> );

		expect( screen.getByRole( 'heading', { name: 'Likes' } ) ).toHaveFocus();
		expect( screen.queryByText( tiledGallery.description ) ).not.toBeInTheDocument();
	} );

	it( 'shows a plain failure notice for a slug the site does not have, once the modules have loaded', () => {
		mockSearch = { configure: 'nope' };
		const { rerender } = render( <SettingsPanel /> );
		expect( screen.getByText( 'Failed to get feature settings' ) ).toBeInTheDocument();

		mockModules = { modules: {}, hasLoaded: false };
		rerender( <SettingsPanel /> );
		expect( screen.queryByText( 'Failed to get feature settings' ) ).not.toBeInTheDocument();
	} );

	it.each( [ 'constructor', '__proto__', 'toString' ] )(
		'treats %s as a slug the site does not have',
		slug => {
			mockSearch = { configure: slug };
			render( <SettingsPanel /> );

			expect( screen.getByText( 'Failed to get feature settings' ) ).toBeInTheDocument();
		}
	);

	it.each( [
		[
			'the close button',
			() => userEvent.click( screen.getByRole( 'button', { name: 'Close' } ) ),
		],
		[ 'Escape', () => userEvent.keyboard( '{Escape}' ) ],
	] )( 'closes on %s, dropping only the configure param', async ( _name, close ) => {
		render( <SettingsPanel /> );
		await close();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		const options = mockNavigate.mock.calls[ 0 ][ 0 ];
		expect( options ).toMatchObject( { replace: true, viewTransition: false } );
		expect( options.search( { configure: 'tiled-gallery', view: 'list' } ) ).toEqual( {
			configure: undefined,
			view: 'list',
		} );
	} );

	it.each( [
		[ 'an Escape something else already handled', 'Escape', true ],
		[ 'any other key', 'Enter', false ],
	] )( 'stays open for %s', ( _name, key, handled ) => {
		render( <SettingsPanel /> );
		const event = new KeyboardEvent( 'keydown', { key, cancelable: true, bubbles: true } );
		if ( handled ) {
			event.preventDefault();
		}
		screen.getByRole( 'heading', { name: 'Tiled Galleries' } ).dispatchEvent( event );

		expect( mockNavigate ).not.toHaveBeenCalled();
	} );

	it( 'stays open for an Escape pressed outside the panel', async () => {
		render( <input aria-label="Search" /> );
		render( <SettingsPanel /> );
		screen.getByRole( 'textbox', { name: 'Search' } ).focus();
		await userEvent.keyboard( '{Escape}' );

		expect( mockNavigate ).not.toHaveBeenCalled();
	} );
} );
