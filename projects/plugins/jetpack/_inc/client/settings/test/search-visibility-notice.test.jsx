import { render, screen } from '@testing-library/react';
import SearchVisibilityNotice from '../search-visibility-notice';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: path => `/wp-admin/${ path }`,
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
