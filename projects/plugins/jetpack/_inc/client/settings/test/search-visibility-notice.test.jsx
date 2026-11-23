import { getScriptData } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import SearchVisibilityNotice from '../search-visibility-notice';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: path => `/wp-admin/${ path }`,
	getScriptData: jest.fn(),
	isWoASite: jest.fn(),
} ) );

it( 'warns and links to Reading when indexing is restricted', () => {
	render( <SearchVisibilityNotice visible={ false } /> );
	expect( screen.getByText( /discourage or prevent search engines/ ) ).toBeInTheDocument();
	expect( screen.getByRole( 'link', { name: 'Review site visibility settings' } ) ).toHaveAttribute(
		'href',
		'/wp-admin/options-reading.php'
	);
} );

it.each( [ true, undefined ] )( 'hides for public or unknown visibility: %s', visible => {
	const { container } = render( <SearchVisibilityNotice visible={ visible } /> );
	expect( container ).toBeEmptyDOMElement();
} );

it( 'leaves the warning to My Jetpack once it shows Settings notices', () => {
	getScriptData.mockReturnValue( { myJetpack: { showsSettingsNotices: true } } );
	const { container } = render( <SearchVisibilityNotice visible={ false } /> );
	expect( container ).toBeEmptyDOMElement();
} );
