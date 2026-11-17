import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyJetpackModule } from '../../../types';
import { setPendingSuccessNotice } from '../../../utils/pending-notice';
import { reloadPage } from '../../../utils/reload-page';
import { ModuleToggle } from '../index';

const mockToggleModule = jest.fn( () => Promise.resolve( true ) );
const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		updateJetpackModuleStatus: mockToggleModule,
		createSuccessNotice: mockCreateSuccessNotice,
		createErrorNotice: mockCreateErrorNotice,
	} ),
	useSelect: callback => callback( () => ( { isModuleUpdating: () => false } ) ),
} ) );

jest.mock( '@wordpress/ui', () => {
	const react = jest.requireActual( 'react' );
	const Anchor = ( { children, ...props } ) => {
		// Anchor-only props that shouldn't land on the DOM node.
		delete props.variant;
		delete props.tone;
		delete props.size;
		delete props.openInNewTab;
		delete props.nativeButton;
		delete props.loading;
		delete props.loadingAnnouncement;
		return react.createElement( 'a', props, children );
	};
	return {
		...jest.requireActual( '@wordpress/ui' ),
		Button: ( { children, render: renderProp, ...props } ) => {
			// Button-only props that shouldn't land on the DOM node.
			delete props.variant;
			delete props.tone;
			delete props.size;
			delete props.openInNewTab;
			delete props.nativeButton;
			delete props.loading;
			delete props.loadingAnnouncement;
			return renderProp
				? react.cloneElement( renderProp, props, children )
				: react.createElement( 'button', props, children );
		},
		ButtonLink: Anchor,
		Link: Anchor,
	};
} );

jest.mock( '../../../utils/module-benefit-messages', () => ( {
	getModuleActivationMessage: ( _slug: string, name: string ) => `${ name } activated.`,
} ) );

// window.location can't be mocked directly, so reloadPage is its own mockable wrapper.
jest.mock( '../../../utils/reload-page' );
jest.mock( '../../../utils/pending-notice' );

const legacyModule = ( overrides = {} ) => ( {
	module: 'sharedaddy',
	name: 'Sharing',
	activated: false,
	available: true,
	description: 'Sharing buttons',
	long_description: '',
	search_terms: '',
	...overrides,
} );

// Legacy modules a block theme can't customize, with the label of the block that replaces them.
const blockThemeModules = [
	[ 'sharedaddy', 'Switch to Sharing Buttons block' ],
	[ 'likes', 'Switch to the Like block' ],
];

const buildModule = ( overrides = {} ) =>
	( {
		module: 'podcast',
		name: 'Podcast',
		activated: true,
		...overrides,
	} ) as unknown as MyJetpackModule;

describe( 'ModuleToggle', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		window.JetpackScriptData = {
			site: { admin_url: 'https://example.com/wp-admin/' },
			myJetpack: {
				siteEditor: {
					isBlockTheme: true,
					isSharingBlockAvailable: true,
					isLikeBlockAvailable: true,
				},
			},
		} as Window[ 'JetpackScriptData' ];
	} );

	it.each( [
		[ 'sharedaddy', false, 'https://example.com/wp-admin/options-general.php?page=sharing' ],
		[ 'likes', false, 'https://example.com/wp-admin/options-general.php?page=sharing#likes' ],
		[ 'sharedaddy', true, 'https://example.com/wp-admin/options-general.php?page=sharing' ],
	] )(
		'links inactive %s to Settings › Sharing on block themes (settings panel: %s)',
		( module, panel, url ) => {
			window.JetpackScriptData.myJetpack.settingsConsolidation = panel;
			render( <ModuleToggle module={ legacyModule( { module } ) } /> );

			const link = screen.getByRole( 'link', {
				name: panel ? 'Manage Sharing in Settings' : 'Configure',
			} );
			expect( link ).toHaveAttribute( 'href', url );
			expect( link ).toHaveTextContent( panel ? 'Manage in Settings' : 'Configure' );
			expect( screen.queryByRole( 'switch' ) ).not.toBeInTheDocument();
		}
	);

	it.each( blockThemeModules )(
		'deactivates legacy %s when switching to the block',
		async ( module, switchLabel ) => {
			mockToggleModule.mockResolvedValue( true );
			render( <ModuleToggle module={ legacyModule( { module, activated: true } ) } /> );

			// The legacy toggle is replaced by the switch action.
			expect( screen.queryByRole( 'switch' ) ).not.toBeInTheDocument();

			await userEvent.click( screen.getByRole( 'button', { name: switchLabel } ) );

			// Deactivating the legacy module reveals the Site Editor link ( two-step, no redirect ).
			expect( mockToggleModule ).toHaveBeenCalledWith( { name: module, active: false } );
		}
	);

	it.each( blockThemeModules )(
		'keeps forced-active legacy %s non-actionable',
		( module, switchLabel ) => {
			render(
				<ModuleToggle module={ legacyModule( { module, activated: true, override: 'active' } ) } />
			);

			expect( screen.getByRole( 'switch' ) ).toBeChecked();
			expect( screen.getByRole( 'switch' ) ).toHaveAttribute( 'aria-disabled', 'true' );
			expect( screen.queryByRole( 'button', { name: switchLabel } ) ).not.toBeInTheDocument();
		}
	);

	it.each( [
		[ 'activity-log', 'Activity Log' ],
		[ 'podcast', 'Podcast' ],
		[ 'subscriptions', 'Newsletter' ],
		[ 'wpcom-reader', 'WordPress.com Reader' ],
	] )( 'reloads the page after toggling the menu-registering %s module', async ( slug, name ) => {
		render( <ModuleToggle module={ buildModule( { module: slug, name } ) } /> );

		await userEvent.click( screen.getByRole( 'switch' ) );

		expect( mockToggleModule ).toHaveBeenCalledWith( { name: slug, active: false } );
		// Persists a notice so it survives the reload, then reloads. No inline notice.
		expect( setPendingSuccessNotice ).toHaveBeenCalledWith(
			expect.stringContaining( 'deactivated' )
		);
		expect( reloadPage ).toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'stays on the page for a menu-registering module when asked not to reload', async () => {
		render(
			<ModuleToggle
				module={ buildModule( { module: 'podcast', name: 'Podcast' } ) }
				reloadAfterToggle={ false }
			/>
		);

		await userEvent.click( screen.getByRole( 'switch' ) );

		expect( mockToggleModule ).toHaveBeenCalledWith( { name: 'podcast', active: false } );
		expect( reloadPage ).not.toHaveBeenCalled();
		expect( setPendingSuccessNotice ).not.toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).toHaveBeenCalled();
	} );

	it( 'sends a second module update only after the first has settled', async () => {
		let settleFirst: ( value: boolean ) => void = () => undefined;
		mockToggleModule.mockImplementationOnce(
			() => new Promise( resolve => ( settleFirst = resolve ) )
		);

		render(
			<>
				<ModuleToggle module={ buildModule( { module: 'podcast', name: 'Podcast' } ) } />
				<ModuleToggle module={ buildModule( { module: 'sitemaps', name: 'Sitemaps' } ) } />
			</>
		);

		const [ podcast, sitemaps ] = screen.getAllByRole( 'switch' );
		await userEvent.click( podcast );
		await userEvent.click( sitemaps );

		expect( mockToggleModule ).toHaveBeenCalledTimes( 1 );

		settleFirst( true );

		await waitFor( () => expect( mockToggleModule ).toHaveBeenCalledTimes( 2 ) );
		expect( mockToggleModule ).toHaveBeenLastCalledWith( { name: 'sitemaps', active: false } );
	} );

	it( 'shows the value the click asked for while the request is still in flight', async () => {
		let release: ( value: boolean ) => void = () => undefined;
		mockToggleModule.mockImplementationOnce(
			() => new Promise( resolve => ( release = resolve ) )
		);

		render( <ModuleToggle module={ buildModule( { module: 'podcast', name: 'Podcast' } ) } /> );

		const toggle = screen.getByRole( 'switch' );
		expect( toggle ).toBeChecked();

		await userEvent.click( toggle );

		// The store still holds the old value; the switch shows the asked-for one.
		await waitFor( () => expect( toggle ).not.toBeChecked() );

		release( true );
		await waitFor( () => expect( mockToggleModule ).toHaveBeenCalledTimes( 1 ) );
	} );

	it( 'goes back to the stored value when the request fails', async () => {
		mockToggleModule.mockResolvedValueOnce( false );

		render( <ModuleToggle module={ buildModule( { module: 'podcast', name: 'Podcast' } ) } /> );

		const toggle = screen.getByRole( 'switch' );
		await userEvent.click( toggle );

		// The store never changed, so dropping the asked-for value restores the old one.
		await waitFor( () => expect( toggle ).toBeChecked() );
	} );

	it( 'explains itself when a request never answers', async () => {
		mockToggleModule.mockRejectedValueOnce( new Error( 'took too long' ) );

		render( <ModuleToggle module={ buildModule( { module: 'podcast', name: 'Podcast' } ) } /> );

		await userEvent.click( screen.getByRole( 'switch' ) );

		// A rejection is a failure like any other, not a silent snap back.
		await waitFor( () => expect( mockCreateErrorNotice ).toHaveBeenCalled() );
		expect( screen.getByRole( 'switch' ) ).toBeChecked();
	} );

	it( 'disables a switch whose request is still waiting its turn', async () => {
		let release: ( value: boolean ) => void = () => undefined;
		mockToggleModule.mockImplementationOnce(
			() => new Promise( resolve => ( release = resolve ) )
		);

		render(
			<>
				<ModuleToggle module={ buildModule( { module: 'podcast', name: 'Podcast' } ) } />
				<ModuleToggle module={ buildModule( { module: 'sitemaps', name: 'Sitemaps' } ) } />
			</>
		);

		const [ podcast, sitemaps ] = screen.getAllByRole( 'switch' );
		await userEvent.click( podcast );
		await userEvent.click( sitemaps );

		// The second request has not reached the store, so only this flag can say it is busy.
		await waitFor( () => expect( sitemaps ).toHaveAttribute( 'aria-disabled', 'true' ) );
		expect( mockToggleModule ).toHaveBeenCalledTimes( 1 );

		// The queue is module-global: leaving this in flight would stall the next test.
		release( true );
		await waitFor( () => expect( mockToggleModule ).toHaveBeenCalledTimes( 2 ) );
	} );

	it.each( [
		[ 'off', true, false ],
		[ 'on', false, true ],
	] )(
		'tells a surface tracking its own events that the click asked for %s',
		async ( _label, activated, asked ) => {
			const onSwitch = jest.fn();

			render(
				<ModuleToggle
					module={ buildModule( { module: 'sitemaps', name: 'Sitemaps', activated } ) }
					onSwitch={ onSwitch }
				/>
			);

			await userEvent.click( screen.getByRole( 'switch' ) );

			expect( onSwitch ).toHaveBeenCalledWith( asked );
		}
	);

	it.each( blockThemeModules )(
		'tells that surface about switching legacy %s to the block, too',
		async ( module, switchLabel ) => {
			const onSwitch = jest.fn();
			mockToggleModule.mockResolvedValue( true );

			render(
				<ModuleToggle
					module={ legacyModule( { module, activated: true } ) }
					onSwitch={ onSwitch }
				/>
			);

			await userEvent.click( screen.getByRole( 'button', { name: switchLabel } ) );

			expect( onSwitch ).toHaveBeenCalledWith( false );
		}
	);

	it( 'does not reload for a regular module and shows an inline notice instead', async () => {
		render( <ModuleToggle module={ buildModule( { module: 'sitemaps', name: 'Sitemaps' } ) } /> );

		await userEvent.click( screen.getByRole( 'switch' ) );

		expect( mockToggleModule ).toHaveBeenCalledWith( { name: 'sitemaps', active: false } );
		expect( reloadPage ).not.toHaveBeenCalled();
		expect( setPendingSuccessNotice ).not.toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).toHaveBeenCalled();
	} );

	it.each( [
		[
			'marks product ownership stale after a switch succeeds',
			true,
			[ [ { queryKey: [ 'product ownership' ] } ] ],
		],
		[ 'leaves product ownership alone when a switch fails', false, [] ],
	] )( '%s', async ( _name, succeeded, expectedCalls ) => {
		mockToggleModule.mockResolvedValueOnce( succeeded );
		const queryClient = new QueryClient();
		const invalidate = jest.spyOn( queryClient, 'invalidateQueries' );

		render(
			<QueryClientProvider client={ queryClient }>
				<ModuleToggle module={ buildModule( { module: 'sitemaps', name: 'Sitemaps' } ) } />
			</QueryClientProvider>
		);
		await userEvent.click( screen.getByRole( 'switch' ) );

		// The notice comes last either way, so the switch has settled once it shows.
		await waitFor( () =>
			expect( succeeded ? mockCreateSuccessNotice : mockCreateErrorNotice ).toHaveBeenCalled()
		);
		expect( invalidate.mock.calls ).toEqual( expectedCalls );
	} );

	it( 'is named by the element it is pointed at, in place of its own label', () => {
		render(
			<>
				<span id="switch-name">Activate this feature</span>
				<ModuleToggle module={ buildModule() } labelledby="switch-name" />
			</>
		);

		expect( screen.getByRole( 'switch', { name: 'Activate this feature' } ) ).toBeInTheDocument();
		expect( screen.queryByLabelText( 'Toggle Podcast module' ) ).not.toBeInTheDocument();
	} );

	it( 'locks the switch when told the site cannot use the module', () => {
		render( <ModuleToggle module={ buildModule() } disabled /> );

		expect( screen.getByRole( 'switch', { name: 'Toggle Podcast module' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
