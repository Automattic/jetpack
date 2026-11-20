import { render, screen } from 'test/test-utils';
import { SearchableModules } from '../index';

const isOff = () => false;

jest.mock( 'components/banner', () => ( { title } ) => <div>{ `Activate ${ title }` }</div> );
jest.mock( 'components/connect-user-bar', () => ( { text } ) => <div>{ text }</div> );
jest.mock( 'components/module-settings/with-module-settings-form-helpers', () => ( {
	withModuleSettingsFormHelpers: Inner => props => <Inner getOptionValue={ isOff } { ...props } />,
} ) );
jest.mock( 'components/pointer-card', () => ( {
	FeaturesPointer: ( { feature, search, linksToSettings = true } ) => (
		<div>
			{ `Features: ${ feature ? `feature=${ feature }` : `search=${ search }` }` }
			{ linksToSettings && ', with settings' }
		</div>
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

const modules = {
	'contact-form': { module: 'contact-form', name: 'Forms', description: 'Add forms.' },
	'json-api': { module: 'json-api', name: 'JSON API', description: 'Use the API.' },
	notes: { module: 'notes', name: 'Notifications', description: 'Get notified.' },
};
const finds = slug => module => module === slug;
const needsOwner = finds( 'notes' );
const ACTIVATE = 'Activate Notifications';
const CONNECT = 'Connect to configure.';
const NOTES = 'Features: search=notifications';
const JSON_API = 'Features: search=json';
const FORMS = 'Features: feature=jetpack-forms, with settings';
const RESULTS = [ ACTIVATE, CONNECT, NOTES, JSON_API, FORMS ];

describe( 'SearchableModules', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'the Activate banner while the settings flag is off', 'notes', false, isOff, ACTIVATE ],
		[ 'a Notifications search in Features once the flag is on', 'notes', true, isOff, NOTES ],
		[ 'a JSON API search in Features once the flag is on', 'json-api', true, isOff, JSON_API ],
		[ 'the Forms card in Features once the flag is on', 'contact-form', true, isOff, FORMS ],
		[ 'the Connect prompt without an owner, flag off', 'notes', false, needsOwner, CONNECT ],
		[ 'the Connect prompt without an owner, flag on', 'notes', true, needsOwner, CONNECT ],
	] )( 'a search shows %s', ( _label, found, flag, isUnavailable, expected ) => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

		render(
			<SearchableModules
				canManageModules
				searchTerm="search"
				modules={ modules }
				isModuleFound={ finds( found ) }
				isUnavailableInSiteConnectionMode={ isUnavailable }
			/>
		);

		expect( RESULTS.filter( result => screen.queryByText( result ) ) ).toEqual( [ expected ] );
	} );
} );
