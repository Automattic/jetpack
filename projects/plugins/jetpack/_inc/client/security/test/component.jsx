import { render, screen } from 'test/test-utils';
import { Security } from '../index';

jest.mock( 'components/settings-card', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

jest.mock( 'components/settings-group', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

const findsFirewall = slug => 'waf' === slug;
const findsNothing = () => false;

const renderSecurity = props =>
	render(
		<Security
			hasProtectPage
			active
			siteAdminUrl="https://example.com/wp-admin/"
			isModuleFound={ findsFirewall }
			isPluginActive={ findsNothing }
			{ ...props }
		/>
	);

describe( 'Security with the Protect page', () => {
	it( 'points a matching search at the Protect page settings', () => {
		renderSecurity( { searchTerm: 'firewall' } );

		expect( screen.getByRole( 'link', { name: 'Open Protect settings' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/admin.php?page=jetpack-protect&p=%2F%3Ftab%3Dsettings'
		);
	} );

	it.each( [
		[ 'without a search', {} ],
		[
			'for a search that matches no security setting',
			{ searchTerm: 'akismet', isModuleFound: findsNothing },
		],
	] )( 'renders nothing %s', ( _name, props ) => {
		const { container } = renderSecurity( props );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
