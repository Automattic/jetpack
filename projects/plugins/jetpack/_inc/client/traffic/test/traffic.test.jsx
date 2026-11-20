import { render, screen } from 'test/test-utils';
import { Traffic } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( 'components/pointer-card', () => ( {
	FeaturesPointer: ( { search } ) => `${ search } pointer`,
} ) );
jest.mock( '../blaze', () => () => 'blaze card' );
jest.mock( '../google-analytics', () => ( { GoogleAnalytics: () => 'ga card' } ) );
jest.mock( '../google-analytics-moved', () => ( {
	GoogleAnalyticsMoved: ( { href } ) => <a href={ href }>ga pointer</a>,
} ) );
jest.mock( '../related-posts', () => ( { RelatedPosts: () => 'related-posts card' } ) );
jest.mock( '../related-posts-moved', () => ( {
	RelatedPostsMoved: () => 'related-posts pointer',
} ) );
jest.mock( '../seo', () => () => null );
jest.mock( '../seo-optin-banner', () => () => 'SEO opt-in banner' );
jest.mock( '../shortlinks', () => () => 'shortlinks card' );
jest.mock( '../site-stats', () => ( { SiteStats: () => null } ) );
jest.mock( '../sitemaps', () => () => null );
jest.mock( '../verification-services', () => ( { VerificationServices: () => null } ) );

// Module scope keeps the prop reference stable (react/jsx-no-bind).
const findsOnlySitemaps = module => module === 'sitemaps';
const findsOnly = {
	'related-posts': module => module === 'related-posts',
	blaze: module => module === 'blaze',
	shortlinks: module => module === 'shortlinks',
	ga: () => false,
};

const PANEL_URL = 'admin.php?page=my-jetpack&p=%2Ffeatures%3Fconfigure%3Dgoogle-analytics';

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
		[ 'ga', 'off, in the tab', false, '', [ 'ga card' ], 'woa' ],
		[ 'ga', 'on, in the tab', true, '', [], 'woa' ],
		[ 'ga', 'on, in a search', true, 'analytics', [ 'ga pointer' ], 'woa' ],
		[ 'ga', 'on, in another search', true, 'sitemap', [], 'woa' ],
		[ 'ga', 'on without the panel', true, '', [ 'ga card' ], 'woa', false ],
	] )(
		'shows %s with the settings flag %s',
		( module, _when, flag, searchTerm, expected, host, gaPanel = PANEL_URL ) => {
			window.JetpackScriptData = {
				myJetpack: { settingsConsolidation: flag, googleAnalyticsPanel: gaPanel },
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

it( 'links the Google Analytics pointer to the panel URL from My Jetpack', () => {
	window.JetpackScriptData = {
		myJetpack: { settingsConsolidation: true, googleAnalyticsPanel: PANEL_URL },
		site: { host: 'woa' },
	};
	try {
		render( <Traffic active searchTerm="google" isModuleFound={ findsOnly.ga } /> );

		expect( screen.getByRole( 'link', { name: 'ga pointer' } ) ).toHaveAttribute(
			'href',
			PANEL_URL
		);
	} finally {
		delete window.JetpackScriptData;
	}
} );
