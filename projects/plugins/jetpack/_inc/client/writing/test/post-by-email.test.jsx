import { render, screen } from 'test/test-utils';
import PostByEmail from '../post-by-email';

const ADDRESS = 'secret123@post.wordpress.com';

jest.mock( 'components/module-settings/with-module-settings-form-helpers', () => ( {
	withModuleSettingsFormHelpers: Component => Component,
} ) );
jest.mock( 'components/module-toggle', () => ( {
	ModuleToggle: () => <div>Post by Email toggle</div>,
} ) );
jest.mock( 'components/settings-card', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );
jest.mock( 'components/settings-group', () => ( {
	__esModule: true,
	default: ( { hasChild, children } ) => (
		<div data-testid="group" data-has-child={ !! hasChild }>
			{ children }
		</div>
	),
} ) );

const initialState = {
	jetpack: {
		modules: { items: { 'post-by-email': { module: 'post-by-email', description: '' } } },
		search: { searchTerm: '' },
	},
};
// Not unavailable in offline mode.
const isOnline = () => false;
const getModule = () => ( {} );
const isSaving = () => false;
// The module is on, with this address.
const optionsWith = address => option =>
	'post_by_email_address' === option ? address : 'post-by-email' === option;

describe( 'PostByEmail', () => {
	it.each( [
		[
			'only Create to a user without the toggle, before an address exists',
			false,
			null,
			[],
			'Create address',
			false,
		],
		[
			'the address to a user without the toggle',
			false,
			ADDRESS,
			[ ADDRESS, 'Copy' ],
			'Regenerate address',
			false,
		],
		[
			'the empty field under the toggle to admins',
			true,
			null,
			[ '', 'Copy' ],
			'Create address',
			true,
		],
	] )( 'shows %s', ( _label, canManageModules, address, field, button, indented ) => {
		render(
			<PostByEmail
				getOptionValue={ optionsWith( address ) }
				isSavingAnyOption={ isSaving }
				userCanManageModules={ canManageModules }
				getModule={ getModule }
				isLinked
				isUnavailableInOfflineMode={ isOnline }
			/>,
			{ initialState }
		);

		const shownField = screen.queryByRole( 'textbox' )
			? [
					screen.getByRole( 'textbox' ).value,
					screen.getByRole( 'button', { name: 'Copy' } ).textContent,
				]
			: [];
		expect( shownField ).toEqual( field );
		expect( screen.getByRole( 'button', { name: button } ) ).toBeEnabled();
		expect( screen.getByTestId( 'group' ) ).toHaveAttribute( 'data-has-child', String( indented ) );
	} );
} );
