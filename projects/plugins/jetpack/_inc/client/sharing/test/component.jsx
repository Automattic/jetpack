import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import { render, screen } from 'test/test-utils';
import { ShareButtons } from '../share-buttons';

jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: jest.fn( key => `https://jetpack.com/redirect/?source=${ key }` ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: jest.fn().mockReturnValue( false ),
} ) );

jest.mock( 'lib/analytics', () => ( {
	tracks: {
		recordEvent: jest.fn(),
		recordJetpackClick: jest.fn(),
	},
} ) );

jest.mock( 'components/settings-card', () => ( { children } ) => <section>{ children }</section> );
jest.mock( 'components/settings-group', () => ( { children } ) => <div>{ children }</div> );
jest.mock( 'components/block-theme-notice', () => () => <div>Block theme notice</div> );
jest.mock( 'components/module-settings/with-module-settings-form-helpers', () => ( {
	withModuleSettingsFormHelpers: Component => Component,
} ) );
jest.mock( 'components/module-toggle', () => ( {
	ModuleToggle: ( { activated, children, disabled } ) => (
		<label htmlFor="sharing-module-toggle">
			<input
				id="sharing-module-toggle"
				type="checkbox"
				checked={ activated }
				disabled={ disabled }
				readOnly
			/>
			{ children }
		</label>
	),
} ) );
jest.mock( 'components/button', () => ( { children, href, ...props } ) => {
	delete props.compact;
	delete props.rna;

	return href ? (
		<a href={ href } { ...props }>
			{ children }
		</a>
	) : (
		<button { ...props }>{ children }</button>
	);
} );
jest.mock( 'components/card', () => ( { children, href, ...props } ) => {
	delete props.compact;

	return (
		<a href={ href } { ...props }>
			{ children }
		</a>
	);
} );

const getActiveOptionValue = () => true;
const getInactiveOptionValue = () => false;
const getModule = () => ( { override: false } );
const getForcedActiveModule = () => ( { override: 'active' } );
const isNotSaving = () => false;
const isSaving = () => true;

describe( 'Sharing buttons settings', () => {
	const updateOptions = jest.fn();
	const defaultProps = {
		getModule,
		getOptionValue: getInactiveOptionValue,
		hasSharingBlock: true,
		isBlockTheme: true,
		isSavingAnyOption: isNotSaving,
		siteAdminUrl: 'https://example.com/wp-admin/',
		themeStylesheet: 'twentytwentyfour',
		updateOptions,
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'requires active legacy sharing to be deactivated before configuring the block', async () => {
		const user = userEvent.setup();
		render( <ShareButtons { ...defaultProps } getOptionValue={ getActiveOptionValue } /> );

		expect(
			screen.getByText( 'Legacy sharing buttons cannot be customized on block themes.' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Open Site Editor' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Switch to Sharing Buttons block' } ) );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_module_toggle', {
			module: 'sharedaddy',
			toggled: 'off',
		} );
		expect( updateOptions ).toHaveBeenCalledWith(
			{ sharedaddy: false },
			expect.objectContaining( {
				progress: 'Deactivating legacy sharing…',
				success: 'Sharing has been deactivated.',
			} )
		);
	} );

	it( 'links inactive legacy sharing to the active theme Single template', async () => {
		const user = userEvent.setup();
		render( <ShareButtons { ...defaultProps } /> );

		expect(
			screen.getByText( 'Add the Sharing Buttons block to your theme’s template.' )
		).toBeInTheDocument();
		const configureLink = screen.getByRole( 'link', { name: 'Open Site Editor' } );
		expect( configureLink ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/site-editor.php?p=%2Fwp_template%2Ftwentytwentyfour%2F%2Fsingle&canvas=edit'
		);
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
		configureLink.addEventListener( 'click', event => event.preventDefault() );

		await user.click( configureLink );

		expect( analytics.tracks.recordJetpackClick ).toHaveBeenCalledWith( {
			target: 'configure-sharing',
			page: 'sharing',
			platform: 'jetpack',
		} );
	} );

	it( 'disables the migration action while legacy sharing is being deactivated', () => {
		render(
			<ShareButtons
				{ ...defaultProps }
				getOptionValue={ getActiveOptionValue }
				isSavingAnyOption={ isSaving }
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Switching…' } ) ).toBeDisabled();
	} );

	it( 'keeps the legacy toggle and configuration link on classic themes', () => {
		render(
			<ShareButtons
				{ ...defaultProps }
				getOptionValue={ getActiveOptionValue }
				isBlockTheme={ false }
			/>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
		expect(
			screen.getByRole( 'link', { name: 'Configure your sharing buttons' } )
		).toHaveAttribute( 'href', 'https://example.com/wp-admin/options-general.php?page=sharing' );
	} );

	it( 'keeps a forced-active module non-actionable', () => {
		render(
			<ShareButtons
				{ ...defaultProps }
				getModule={ getForcedActiveModule }
				getOptionValue={ getActiveOptionValue }
			/>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeDisabled();
		expect(
			screen.queryByRole( 'button', { name: 'Switch to Sharing Buttons block' } )
		).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Open Site Editor' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the existing block-theme fallback when the exact template URL is unavailable', () => {
		render( <ShareButtons { ...defaultProps } themeStylesheet="" /> );

		expect( screen.getByRole( 'checkbox' ) ).not.toBeChecked();
		expect( screen.getByText( 'Block theme notice' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: 'Configure your sharing buttons' } )
		).toHaveAttribute( 'href', 'https://example.com/wp-admin/site-editor.php?path=%2Fwp_template' );
	} );
} );
