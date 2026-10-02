/**
 * The sidebar reads the server object once at module scope, so the flag has to
 * be in place before the component is required — hence require() over import,
 * and one file per server-object state.
 */
jest.mock( 'hooks/use-search-options', () => ( {
	__esModule: true,
	default: () => ( {
		color: '#000000',
		excludedPostTypes: [],
		infiniteScroll: true,
		filteringOpensOverlay: true,
		resultFormat: 'minimal',
		setColor: jest.fn(),
		setExcludedPostTypes: jest.fn(),
		setInfiniteScroll: jest.fn(),
		setFilteringOpensOverlay: jest.fn(),
		setResultFormat: jest.fn(),
		setShowLogo: jest.fn(),
		setSort: jest.fn(),
		setTheme: jest.fn(),
		showLogo: true,
		sort: 'relevance',
		theme: 'light',
		aiAnswersEnabled: true,
		setAiAnswersEnabled: jest.fn(),
	} ),
} ) );
jest.mock( 'hooks/use-entity-record-state', () => ( {
	__esModule: true,
	default: () => ( { isSaving: false } ),
} ) );
jest.mock( 'hooks/use-loading-state', () => ( {
	__esModule: true,
	default: () => ( { isLoading: false } ),
} ) );
jest.mock( '../color-control', () => () => null );
jest.mock( '../excluded-post-types-control', () => () => null );
jest.mock( '../theme-control', () => () => null );

// No aiMasterEnabled key: a back end that predates the field must not gate the toggle.
window.JetpackInstantSearchOptions = { isFreePlan: false };

const { render, screen } = require( '@testing-library/react' );
const React = require( 'react' );
const SidebarOptions = require( '../sidebar-options' ).default;

/**
 * Render the sidebar for this file's server-object state.
 */
function renderSidebar() {
	render( React.createElement( SidebarOptions ) );
}

describe( 'SidebarOptions with the site-wide AI switch on', () => {
	it( 'leaves the AI Answers toggle usable', () => {
		renderSidebar();

		expect( screen.getByLabelText( 'Enable AI Answers' ) ).toBeEnabled();
	} );

	it( 'shows the normal help text', () => {
		renderSidebar();

		expect(
			screen.getByText( /Generate AI-powered answers to visitor queries/ )
		).toBeInTheDocument();
	} );

	it( 'does not mention the AI switch', () => {
		renderSidebar();

		expect( screen.queryByText( /Jetpack AI is turned off/ ) ).not.toBeInTheDocument();
	} );
} );
