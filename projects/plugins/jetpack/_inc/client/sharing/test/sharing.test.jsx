import { render, screen } from 'test/test-utils';
import { Sharing } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( 'components/pointer-card', () => ( {
	FeaturesPointer: ( { search } ) => <div>{ `Features pointer: ${ search }` }</div>,
} ) );
jest.mock( '../likes', () => ( { Likes: () => null } ) );
jest.mock( '../publicize', () => ( { Publicize: () => 'Social card' } ) );
jest.mock( '../share-buttons', () => ( { ShareButtons: () => null } ) );

const findsOnlyPublicize = module => module === 'publicize';

describe( 'Sharing settings', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'the Social card while the settings flag is off', false, true, 'Social card' ],
		[
			'a pointer to Features for admins once the flag is on',
			true,
			true,
			'Features pointer: social',
		],
		[ 'the Social card for users who cannot manage modules', true, false, 'Social card' ],
	] )( 'a Social search shows %s', ( _label, flag, canManageModules, expected ) => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

		render(
			<Sharing
				searchTerm="social"
				isModuleFound={ findsOnlyPublicize }
				userCanManageModules={ canManageModules }
			/>
		);

		expect( screen.getByText( expected ) ).toBeInTheDocument();
	} );

	it( 'leaves Social off the tab for admins once the settings flag is on', () => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: true } };

		const { container } = render(
			<Sharing active isModuleFound={ findsOnlyPublicize } userCanManageModules />
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
