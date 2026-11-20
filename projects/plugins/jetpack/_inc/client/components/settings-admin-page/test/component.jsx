import { MemoryRouter } from 'react-router';
import { render, screen } from 'test/test-utils';
import SettingsAdminPage from '../index';

jest.mock( '@automattic/jetpack-components', () => ( {
	AdminPage: ( { subTitle } ) => <p data-testid="subtitle">{ subTitle ?? '' }</p>,
} ) );

const buildState = ( manageModules, activeModules ) => ( {
	jetpack: {
		initialState: {
			userData: { currentUser: { permissions: { manage_modules: manageModules } } },
		},
		modules: {
			items: Object.fromEntries( activeModules.map( name => [ name, { activated: true } ] ) ),
		},
		devCard: {},
	},
} );

describe( 'SettingsAdminPage subtitle at /settings', () => {
	it.each( [
		[ 'an admin', true, [ 'publicize' ], /^Your site is protected by Jetpack/ ],
		[
			'a non-admin with Publicize',
			false,
			[ 'publicize', 'post-by-email' ],
			/^Share your content/,
		],
		[ 'a non-admin with Post by Email', false, [ 'post-by-email' ], /^Compose content/ ],
		[ 'a non-admin with neither', false, [], /^$/ ],
	] )( 'describes what renders for %s', ( _, manageModules, activeModules, expected ) => {
		render(
			<MemoryRouter initialEntries={ [ '/settings' ] }>
				<SettingsAdminPage />
			</MemoryRouter>,
			{ initialState: buildState( manageModules, activeModules ) }
		);

		expect( screen.getByTestId( 'subtitle' ) ).toHaveTextContent( new RegExp( expected ) );
	} );
} );
