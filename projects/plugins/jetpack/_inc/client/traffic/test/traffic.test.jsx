import { render, screen } from 'test/test-utils';
import { Traffic } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( 'components/pointer-card', () => ( {
	FeaturesPointer: ( { search } ) => `${ search } pointer`,
} ) );
jest.mock( '../blaze', () => () => 'blaze card' );
jest.mock( '../google-analytics', () => ( { GoogleAnalytics: () => null } ) );
jest.mock( '../related-posts', () => ( { RelatedPosts: () => 'related-posts card' } ) );
jest.mock( '../related-posts-moved', () => ( {
	RelatedPostsMoved: () => 'related-posts pointer',
} ) );
jest.mock( '../seo', () => () => null );
jest.mock( '../seo-moved', () => ( { SeoMoved: () => <p>SEO pointer</p> } ) );
jest.mock( '../seo-optin-banner', () => () => 'SEO opt-in banner' );
jest.mock( '../shortlinks', () => () => 'shortlinks card' );
jest.mock( '../site-stats', () => ( { SiteStats: () => null } ) );
jest.mock( '../sitemaps', () => () => null );
jest.mock( '../verification-services', () => ( { VerificationServices: () => null } ) );

// Module scope keeps the prop reference stable (react/jsx-no-bind).
const findsOnlySitemaps = module => module === 'sitemaps';
const findsOnly = {
	'seo-tools': module => module === 'seo-tools',
	'canonical-urls': module => module === 'canonical-urls',
	sitemaps: findsOnlySitemaps,
	'verification-tools': module => module === 'verification-tools',
	'related-posts': module => module === 'related-posts',
	blaze: module => module === 'blaze',
	shortlinks: module => module === 'shortlinks',
};

describe( 'Traffic settings', () => {
	it( 'renders the SEO opt-in banner when a search finds only the sitemaps section', () => {
		render( <Traffic searchTerm="sitemap" isModuleFound={ findsOnlySitemaps } /> );

		expect( screen.getByText( 'SEO opt-in banner' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'seo-tools', 'in a search', true, 'seo', true ],
		[ 'canonical-urls', 'in a search', true, 'canonical', true ],
		[ 'sitemaps', 'in a search', true, 'sitemap', true ],
		[ 'verification-tools', 'in a search', true, 'verification', true ],
		[ 'sitemaps', 'in the tab', true, '', false ],
		[ 'sitemaps', 'in a search before the move', false, 'sitemap', false ],
	] )( 'SEO pointer for %s %s', ( module, _when, moved, searchTerm, expected ) => {
		window.JetpackScriptData = { seo: { surface_visible: moved } };
		try {
			render( <Traffic active searchTerm={ searchTerm } isModuleFound={ findsOnly[ module ] } /> );

			expect( !! screen.queryByText( 'SEO pointer' ) ).toBe( expected );
		} finally {
			delete window.JetpackScriptData;
		}
	} );

	it.each( [
		[ 'related-posts', 'off, in the tab', false, '', [ 'related-posts card' ], '' ],
		[ 'related-posts', 'off, in a search', false, 'related', [ 'related-posts card' ], '' ],
		[ 'related-posts', 'on, in the tab', true, '', [], '' ],
		[ 'related-posts', 'on, in a search', true, 'related', [ 'related-posts pointer' ], '' ],
		[ 'blaze', 'off, in the tab', false, '', [ 'blaze card' ], '' ],
		[ 'blaze', 'on, in the tab', true, '', [], '' ],
		[ 'blaze', 'on, in a search', true, 'blaze', [ 'blaze pointer' ], '' ],
		[ 'blaze', 'on, in a search on WoA', true, 'blaze', [], 'woa' ],
		[ 'shortlinks', 'off, in the tab', false, '', [ 'shortlinks card' ], '' ],
		[ 'shortlinks', 'on, in the tab', true, '', [], '' ],
		[ 'shortlinks', 'on, in a search', true, 'shortlinks', [ 'shortlinks pointer' ], '' ],
	] )(
		'shows %s with the settings flag %s',
		( module, _when, flag, searchTerm, expected, host ) => {
			window.JetpackScriptData = {
				myJetpack: { settingsConsolidation: flag },
				site: { host },
			};
			try {
				render(
					<Traffic active searchTerm={ searchTerm } isModuleFound={ findsOnly[ module ] } />
				);

				const shown = [ `${ module } card`, `${ module } pointer` ].filter( text =>
					screen.queryByText( text )
				);
				expect( shown ).toEqual( expected );
			} finally {
				delete window.JetpackScriptData;
			}
		}
	);
} );
