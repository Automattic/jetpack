import { render, screen } from 'test/test-utils';
import { Sitemaps } from '../sitemaps';

jest.mock( 'components/settings-card', () => ( {
	__esModule: true,
	default: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( 'components/settings-group', () => ( {
	__esModule: true,
	default: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( 'components/module-toggle', () => ( {
	ModuleToggle: ( { children } ) => <div>{ children }</div>,
} ) );

describe( 'Sitemaps', () => {
	const defaultProps = {
		getModule: () => ( {
			extra: {
				sitemap_url: 'https://example.com/sitemap.xml',
				news_sitemap_url: 'https://example.com/news-sitemap.xml',
			},
		} ),
		getOptionValue: () => true,
		isSavingAnyOption: () => false,
		isSiteVisibleToSearchEngines: false,
		isWpcomAtomic: false,
		siteAdminUrl: 'https://example.com/wp-admin/',
		siteRawUrl: 'example.com',
		toggleModuleNow: jest.fn(),
	};

	it( 'links non-Atomic sites to Reading settings', () => {
		render( <Sitemaps { ...defaultProps } /> );

		expect( screen.getByRole( 'link', { name: 'Reading settings' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/options-reading.php'
		);
	} );

	it( 'links WordPress.com Atomic sites to Site Visibility settings', () => {
		render( <Sitemaps { ...defaultProps } isWpcomAtomic /> );

		expect( screen.getByRole( 'link', { name: 'Site Visibility settings' } ) ).toHaveAttribute(
			'href',
			'https://wordpress.com/sites/example.com/settings/site-visibility'
		);
	} );
} );
