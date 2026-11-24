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

const ADMIN = 'https://example.com/wp-admin/';
const finds = slugs => slug => slugs.includes( slug );
const findsNothing = () => false;
const akismetActive = plugin => 'akismet/akismet.php' === plugin;
const akismetData = () => ( { Description: 'Spam protection', PluginURI: '' } );

const renderSecurity = props =>
	render(
		<Security
			hasProtectPage
			active
			siteAdminUrl={ ADMIN }
			isModuleFound={ findsNothing }
			isPluginActive={ findsNothing }
			isPluginInstalled={ akismetData }
			{ ...props }
		/>
	);

describe( 'Security with the Protect page', () => {
	it.each( [
		[
			'Protect settings',
			{ searchTerm: 'firewall', isModuleFound: finds( [ 'waf' ] ) },
			'Open Protect settings',
			`${ ADMIN }admin.php?page=jetpack-protect&p=%2F%3Ftab%3Dsettings`,
		],
		[
			'the Backup page',
			{ searchTerm: 'backup', isModuleFound: finds( [ 'backup' ] ), hasBackupPage: true },
			'Open Backup',
			`${ ADMIN }admin.php?page=jetpack-backup`,
		],
		[
			'My Jetpack when there is no Backup page',
			{ searchTerm: 'vaultpress', isModuleFound: finds( [ 'vaultpress' ] ) },
			'Set up Backup',
			`${ ADMIN }admin.php?page=my-jetpack#/add-backup`,
		],
		[
			'the Akismet page',
			{ searchTerm: 'spam', isPluginActive: akismetActive },
			'Open Akismet Anti-spam',
			`${ ADMIN }admin.php?page=akismet-key-config`,
		],
	] )( 'points a matching search at %s', ( _name, props, linkName, href ) => {
		renderSecurity( props );

		expect( screen.getAllByRole( 'link' ) ).toHaveLength( 1 );
		expect( screen.getByRole( 'link', { name: linkName } ) ).toHaveAttribute( 'href', href );
	} );

	it.each( [
		[ 'without a search', {} ],
		[ 'for a search that matches no security setting', { searchTerm: 'sharing' } ],
	] )( 'renders nothing %s', ( _name, props ) => {
		const { container } = renderSecurity( props );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
