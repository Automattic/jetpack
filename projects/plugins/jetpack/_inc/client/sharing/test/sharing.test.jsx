import { render, screen } from 'test/test-utils';
import { Sharing } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( '../likes', () => ( { Likes: () => null } ) );
jest.mock( '../publicize', () => ( { Publicize: () => 'Social card' } ) );
jest.mock( '../share-buttons', () => ( { ShareButtons: () => null } ) );

const findsOnlyPublicize = module => module === 'publicize';

describe( 'Sharing settings', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'keeps the Social card while the settings flag is off', false, true, true ],
		[ 'drops the Social card for admins once the flag is on', true, true, false ],
		[ 'keeps the Social card for users who cannot manage modules', true, false, true ],
	] )( '%s', ( _label, flag, canManageModules, shown ) => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

		render(
			<Sharing
				searchTerm="social"
				isModuleFound={ findsOnlyPublicize }
				userCanManageModules={ canManageModules }
			/>
		);

		expect( Boolean( screen.queryByText( 'Social card' ) ) ).toBe( shown );
		expect( Boolean( screen.queryByRole( 'heading', { name: 'Sharing' } ) ) ).toBe( shown );
	} );
} );
