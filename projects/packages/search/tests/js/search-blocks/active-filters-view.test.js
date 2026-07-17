// `@wordpress/interactivity` is an externalized dep — mock virtually so the
// view.js file can be required and its getters / actions captured.
const captured = {
	state: {},
	actions: {},
};
const contextRef = { current: { pill: null } };

jest.mock(
	'@wordpress/interactivity',
	() => ( {
		store: ( _namespace, config ) => {
			if ( config ) {
				const descriptors = Object.getOwnPropertyDescriptors( config.state || {} );
				for ( const key of Object.keys( descriptors ) ) {
					const descriptor = descriptors[ key ];
					if ( typeof descriptor.get === 'function' ) {
						Object.defineProperty( captured.state, key, descriptor );
					} else {
						captured.state[ key ] = descriptor.value;
					}
				}
				Object.assign( captured.actions, config.actions || {} );
			}
			return { state: captured.state, actions: captured.actions };
		},
		getContext: () => contextRef.current,
	} ),
	{ virtual: true }
);

jest.mock( '../../../src/search-blocks/store', () => ( {} ), { virtual: true } );
jest.mock( '../../../src/search-blocks/blocks/active-filters/style.scss', () => ( {} ), {
	virtual: true,
} );

require( '../../../src/search-blocks/blocks/active-filters/view' );

describe( 'active-filters view store — activePills label resolution', () => {
	beforeEach( () => {
		captured.state.activeFilters = {};
		captured.state.aggregations = {};
		captured.state.filterConfigs = {};
		captured.state.strings = { removeFilter: 'Remove %s' };
		contextRef.current = { pill: null };
	} );

	it( 'renders taxonomy/author labels via post-slash split of slug_slash_name buckets', () => {
		captured.state.activeFilters = {
			category: [ 'news' ],
			authors: [ 'sarach' ],
		};
		captured.state.aggregations = {
			category: { buckets: [ { key: 'news/News' } ] },
			authors: { buckets: [ { key: 'sarach/Sarah Chen' } ] },
		};
		captured.state.filterConfigs = {
			category: { label: 'Category', valueLabels: {} },
			authors: { label: 'Author', valueLabels: {} },
		};
		const labels = captured.state.activePills.map( p => p.label );
		expect( labels ).toEqual( [ 'Category: News', 'Author: Sarah Chen' ] );
	} );

	it( 'renders post_type labels via the filterConfig valueLabels map', () => {
		captured.state.activeFilters = { post_types: [ 'post', 'page' ] };
		captured.state.aggregations = {
			post_types: { buckets: [ { key: 'post' }, { key: 'page' } ] },
		};
		captured.state.filterConfigs = {
			post_types: {
				label: 'Post Type',
				valueLabels: { post: 'Post', page: 'Page' },
			},
		};
		const labels = captured.state.activePills.map( p => p.label );
		expect( labels ).toEqual( [ 'Post Type: Post', 'Post Type: Page' ] );
	} );

	it( 'falls back to the slug when no bucket matches and no valueLabels entry exists', () => {
		// Selected value has dropped out of the top-N agg buckets; the pill
		// must still render rather than blanking, even without a label.
		captured.state.activeFilters = { category: [ 'news' ] };
		captured.state.aggregations = { category: { buckets: [] } };
		captured.state.filterConfigs = { category: { label: 'Category' } };
		expect( captured.state.activePills[ 0 ].label ).toBe( 'Category: news' );
	} );

	it( 'prefers valueLabels over the matching bucket label', () => {
		// Future filter types (e.g. filter-date, RSM-1921) will seed
		// valueLabels with the formatted display string the block built. Even
		// if a matching bucket exists, the config-supplied label wins.
		captured.state.activeFilters = { post_types: [ 'attachment' ] };
		captured.state.aggregations = { post_types: { buckets: [ { key: 'attachment' } ] } };
		captured.state.filterConfigs = {
			post_types: {
				label: 'Post Type',
				valueLabels: { attachment: 'Media file' },
			},
		};
		expect( captured.state.activePills[ 0 ].label ).toBe( 'Post Type: Media file' );
	} );

	it( 'uses removeFilter format string for the aria-label', () => {
		captured.state.strings.removeFilter = 'Remove %s filter';
		captured.state.activeFilters = { category: [ 'news' ] };
		captured.state.aggregations = { category: { buckets: [ { key: 'news/News' } ] } };
		captured.state.filterConfigs = { category: { label: 'Category', valueLabels: {} } };
		expect( captured.state.activePills[ 0 ].ariaLabel ).toBe( 'Remove Category: News filter' );
	} );
} );
