import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import { render, screen } from 'test/test-utils';
import { Likes } from '../likes';

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
jest.mock( 'components/settings-group', () => ( { children, support } ) => (
	<div>
		{ children }
		<a href={ support?.link }>Learn more</a>
	</div>
) );
jest.mock( 'components/module-settings/with-module-settings-form-helpers', () => ( {
	withModuleSettingsFormHelpers: Component => Component,
} ) );
jest.mock( 'components/module-toggle', () => ( {
	ModuleToggle: ( { activated, children, disabled } ) => (
		<label htmlFor="likes-module-toggle">
			<input
				id="likes-module-toggle"
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

const getActiveOptionValue = () => true;
const getInactiveOptionValue = () => false;
const getModule = () => ( { override: false } );
const getForcedActiveModule = () => ( { override: 'active' } );
const isNotSaving = () => false;
const isSaving = () => true;
const isAvailableInOfflineMode = () => false;
const isUnavailableInOfflineMode = () => true;

describe( 'Like buttons settings', () => {
	const updateOptions = jest.fn();
	const defaultProps = {
		getModule,
		getOptionValue: getInactiveOptionValue,
		hasLikeBlock: true,
		isBlockTheme: true,
		isSavingAnyOption: isNotSaving,
		isUnavailableInOfflineMode: isAvailableInOfflineMode,
		siteAdminUrl: 'https://example.com/wp-admin/',
		updateOptions,
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'requires active legacy likes to be deactivated before configuring the block', async () => {
		const user = userEvent.setup();
		render( <Likes { ...defaultProps } getOptionValue={ getActiveOptionValue } /> );

		expect(
			screen.getByText( 'Legacy Like buttons cannot be customized on block themes.' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Configure your Like buttons' } )
		).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Switch to the Like block' } ) );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_module_toggle', {
			module: 'likes',
			toggled: 'off',
		} );
		expect( updateOptions ).toHaveBeenCalledWith(
			{ likes: false },
			expect.objectContaining( {
				progress: 'Deactivating legacy Like buttons…',
				success: 'Like buttons have been deactivated.',
			} )
		);
	} );

	it( 'links inactive legacy likes to Settings › Sharing', async () => {
		const user = userEvent.setup();
		render( <Likes { ...defaultProps } /> );

		expect(
			screen.getByText( 'Choose where the Like block goes on your posts and pages.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Learn more' } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-support-like-block'
		);
		const configureLink = screen.getByRole( 'link', { name: 'Configure your Like buttons' } );
		expect( configureLink ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/options-general.php?page=sharing#likes'
		);
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
		configureLink.addEventListener( 'click', event => event.preventDefault() );

		await user.click( configureLink );

		expect( analytics.tracks.recordJetpackClick ).toHaveBeenCalledWith( {
			target: 'configure-like-block',
			page: 'sharing',
			platform: 'jetpack',
		} );
	} );

	it( 'disables the migration action while legacy likes are being deactivated', () => {
		render(
			<Likes
				{ ...defaultProps }
				getOptionValue={ getActiveOptionValue }
				isSavingAnyOption={ isSaving }
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Switching…' } ) ).toBeDisabled();
	} );

	it( 'keeps the legacy toggle and configuration link on classic themes', async () => {
		const user = userEvent.setup();
		render(
			<Likes { ...defaultProps } getOptionValue={ getActiveOptionValue } isBlockTheme={ false } />
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
		expect(
			screen.queryByRole( 'button', { name: 'Switch to the Like block' } )
		).not.toBeInTheDocument();
		const configureLink = screen.getByRole( 'link', { name: 'Configure your Like buttons' } );
		expect( configureLink ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/options-general.php?page=sharing#likes'
		);
		configureLink.addEventListener( 'click', event => event.preventDefault() );

		await user.click( configureLink );

		expect( analytics.tracks.recordJetpackClick ).toHaveBeenCalledWith( {
			target: 'configure-likes',
			page: 'sharing',
			platform: 'jetpack',
		} );
	} );

	it( 'hides the configuration link while legacy likes are off on classic themes', () => {
		render( <Likes { ...defaultProps } isBlockTheme={ false } /> );

		expect( screen.getByRole( 'checkbox' ) ).not.toBeChecked();
		expect(
			screen.queryByRole( 'link', { name: 'Configure your Like buttons' } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps the legacy toggle when the Like block is unavailable', () => {
		render(
			<Likes { ...defaultProps } getOptionValue={ getActiveOptionValue } hasLikeBlock={ false } />
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
		expect(
			screen.queryByRole( 'button', { name: 'Switch to the Like block' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Learn more' } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-support-likes'
		);
	} );

	it( 'keeps a forced-active module non-actionable', () => {
		render(
			<Likes
				{ ...defaultProps }
				getModule={ getForcedActiveModule }
				getOptionValue={ getActiveOptionValue }
			/>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeDisabled();
		expect(
			screen.queryByRole( 'button', { name: 'Switch to the Like block' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Configure your Like buttons' } )
		).not.toBeInTheDocument();
	} );

	it( 'hides the configuration link in offline mode', () => {
		render(
			<Likes { ...defaultProps } isUnavailableInOfflineMode={ isUnavailableInOfflineMode } />
		);

		expect(
			screen.queryByRole( 'link', { name: 'Configure your Like buttons' } )
		).not.toBeInTheDocument();
	} );

	it( 'disables the toggle in offline mode', () => {
		render(
			<Likes
				{ ...defaultProps }
				isBlockTheme={ false }
				isUnavailableInOfflineMode={ isUnavailableInOfflineMode }
			/>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeDisabled();
	} );
} );
