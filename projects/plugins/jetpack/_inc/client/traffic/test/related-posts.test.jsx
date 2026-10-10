import { getSupportUrl, openWpcomSupportDoc } from 'components/support-link';
import { render, screen } from 'test/test-utils';
import { RelatedPostsComponent } from '../related-posts';

jest.mock( 'lib/analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordJetpackClick: jest.fn() } },
} ) );

jest.mock( 'components/support-link', () => ( {
	__esModule: true,
	default: () => null,
	getSupportUrl: jest.fn( ( href, wpcomLink ) => wpcomLink ),
	openWpcomSupportDoc: jest.fn(),
} ) );

const WPCOM_DOC = 'https://wordpress.com/support/related-posts/';

describe( 'RelatedPosts configure link', () => {
	const baseProps = {
		getOptionValue: () => false,
		lastPostUrl: 'https://example.com/hello-world/',
		siteAdminUrl: 'https://example.com/wp-admin/',
	};

	afterEach( () => {
		getSupportUrl.mockClear();
		openWpcomSupportDoc.mockClear();
	} );

	it( 'links block themes to the support doc and opens it in the Help Center', async () => {
		const component = new RelatedPostsComponent( { ...baseProps, isBlockThemeActive: true } );
		render( component.renderConfigureLink() );

		const link = screen.getByRole( 'link', { name: /Related Posts Block/ } );
		expect( getSupportUrl ).toHaveBeenCalledWith( expect.stringContaining( 'jetpack' ), WPCOM_DOC );
		expect( link ).toHaveAttribute( 'href', WPCOM_DOC );

		link.click();
		expect( openWpcomSupportDoc ).toHaveBeenCalledWith( expect.anything(), WPCOM_DOC );
	} );

	it( 'links classic themes to the Customizer', () => {
		const component = new RelatedPostsComponent( { ...baseProps, isBlockThemeActive: false } );
		render( component.renderConfigureLink() );

		expect( screen.getByRole( 'link', { name: /Customizer/ } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'customize.php?autofocus' )
		);
		expect( openWpcomSupportDoc ).not.toHaveBeenCalled();
	} );
} );
