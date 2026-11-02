import { render, screen } from 'test/test-utils';
import { Traffic } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( '../blaze', () => () => null );
jest.mock( '../google-analytics', () => ( { GoogleAnalytics: () => null } ) );
jest.mock( '../related-posts', () => ( { RelatedPosts: () => null } ) );
jest.mock( '../seo', () => () => null );
jest.mock( '../seo-optin-banner', () => () => 'SEO opt-in banner' );
jest.mock( '../shortlinks', () => () => null );
jest.mock( '../site-stats', () => ( { SiteStats: () => null } ) );
jest.mock( '../sitemaps', () => () => null );
jest.mock( '../verification-services', () => ( { VerificationServices: () => null } ) );

// Module scope keeps the prop reference stable (react/jsx-no-bind).
const findsOnlySitemaps = module => module === 'sitemaps';

describe( 'Traffic settings', () => {
	it( 'renders the SEO opt-in banner when a search finds only the sitemaps section', () => {
		render( <Traffic searchTerm="sitemap" isModuleFound={ findsOnlySitemaps } /> );

		expect( screen.getByText( 'SEO opt-in banner' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing when a search finds only sections that moved to the SEO dashboard', () => {
		window.JetpackScriptData = { seo: { surface_visible: true } };
		try {
			const { container } = render(
				<Traffic searchTerm="sitemap" isModuleFound={ findsOnlySitemaps } />
			);

			expect( container ).toBeEmptyDOMElement();
		} finally {
			delete window.JetpackScriptData;
		}
	} );
} );
