import { render, screen } from 'test/test-utils';
import { AccountProtection } from '../account-protection';

const isOff = () => false;

jest.mock( 'components/module-settings/with-module-settings-form-helpers', () => ( {
	withModuleSettingsFormHelpers: Inner => props => (
		<Inner getOptionValue={ isOff } isSavingAnyOption={ isOff } { ...props } />
	),
} ) );

jest.mock( 'components/module-toggle', () => ( {
	ModuleToggle: ( { disabled } ) => (
		<input type="checkbox" aria-label="Account protection" disabled={ disabled } />
	),
} ) );

jest.mock( 'components/settings-card', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

jest.mock( 'components/settings-group', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

const initialState = {
	jetpack: {
		modules: { items: { 'account-protection': { module: 'account-protection' } } },
		search: { searchTerm: '' },
	},
};
const getModule = () => ( {} );
const unavailableOffline = slug => 'account-protection' === slug;

describe( 'AccountProtection', () => {
	it.each( [
		[ 'disables', 'in offline mode', unavailableOffline, 'toBeDisabled' ],
		[ 'enables', 'when connected', isOff, 'toBeEnabled' ],
	] )( '%s the toggle %s', ( _verb, _when, isUnavailableInOfflineMode, matcher ) => {
		render(
			<AccountProtection
				getModule={ getModule }
				isUnavailableInOfflineMode={ isUnavailableInOfflineMode }
			/>,
			{ initialState }
		);

		expect( screen.getByRole( 'checkbox', { name: 'Account protection' } ) )[ matcher ]();
	} );
} );
