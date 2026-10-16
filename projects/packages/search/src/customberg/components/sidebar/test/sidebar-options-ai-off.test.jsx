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

window.JetpackInstantSearchOptions = { isFreePlan: false, aiMasterEnabled: false };

const { render, screen } = require( '@testing-library/react' );
const React = require( 'react' );
const SidebarOptions = require( '../sidebar-options' ).default;

/**
 * Render the sidebar for this file's server-object state.
 */
function renderSidebar() {
	render( React.createElement( SidebarOptions ) );
}

describe( 'SidebarOptions with the site-wide AI switch off', () => {
	it( 'locks the AI Answers toggle', () => {
		renderSidebar();

		expect( screen.getByLabelText( 'Enable AI Answers' ) ).toBeDisabled();
	} );

	it( 'explains why the toggle is locked', () => {
		renderSidebar();

		expect( screen.getByText( /Jetpack AI is turned off for this site/ ) ).toBeInTheDocument();
	} );

	it( 'keeps showing the saved choice', () => {
		renderSidebar();

		expect( screen.getByLabelText( 'Enable AI Answers' ) ).toBeChecked();
	} );
} );
