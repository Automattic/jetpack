// Pins the pure helpers behind the filter-checkbox inspector. The component
// itself is integration-tested via the editor; here we lock the variation
// identification, attribute mapping, and label-default logic in isolation
// because subtle changes (e.g. dropping `previousTaxonomy` for Author) have
// silently broken slug round-trips in the past.

import { render, screen } from '@testing-library/react';
import {
	default as FilterCheckboxEdit,
	deriveVariation,
	normalizeDisplayStyle,
	variationToAttributes,
	variationDefaultLabel,
	variationOptions,
	VARIATION_CATEGORY,
	VARIATION_POST_TAG,
	VARIATION_POST_TYPE,
	VARIATION_AUTHOR,
	VARIATION_PRODUCT_CAT,
	VARIATION_PRODUCT_TAG,
	VARIATION_PRODUCT_BRAND,
	VARIATION_CUSTOM_TAXONOMY,
} from '../../../src/search-blocks/blocks/filter-checkbox/edit.js';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( {
		className: 'wp-block-jetpack-search-filter-checkbox',
		...props,
	} ),
	InspectorControls: ( { children } ) => <div data-testid="inspector-controls">{ children }</div>,
} ) );

let controlIdCounter = 0;
const nextControlId = () => `mock-control-${ ++controlIdCounter }`;

beforeEach( () => {
	controlIdCounter = 0;
} );

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { children } ) => <div>{ children }</div>,
	Placeholder: ( { children } ) => <div>{ children }</div>,
	SelectControl: ( { label, value, options = [], onChange, help } ) => {
		const id = nextControlId();
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<select
					id={ id }
					value={ value || '' }
					onChange={ event => onChange( event.target.value ) }
				>
					{ options.map( option => (
						<option key={ option.value } value={ option.value } disabled={ !! option.disabled }>
							{ option.label }
						</option>
					) ) }
				</select>
				{ help ? <p>{ help }</p> : null }
			</>
		);
	},
	RangeControl: ( { label, value, onChange, min = 0, max = 100 } ) => {
		const id = nextControlId();
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					type="range"
					min={ min }
					max={ max }
					value={ value }
					onChange={ event => onChange( Number( event.target.value ) ) }
				/>
			</>
		);
	},
	TextControl: ( { label, value, onChange } ) => {
		const id = nextControlId();
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					type="text"
					value={ value || '' }
					onChange={ event => onChange( event.target.value ) }
				/>
			</>
		);
	},
	ToggleControl: ( { label, checked, onChange } ) => {
		const id = nextControlId();
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					type="checkbox"
					checked={ !! checked }
					onChange={ event => onChange( event.target.checked ) }
				/>
			</>
		);
	},
	// Minimal stub for the __experimentalToggleGroupControl family — renders
	// label + children so existing preview snapshot tests run; the picker UX
	// itself isn't exercised in this file.
	__experimentalToggleGroupControl: ( { label, children } ) => (
		<fieldset aria-label={ label }>
			<legend>{ label }</legend>
			{ children }
		</fieldset>
	),
	__experimentalToggleGroupControlOption: ( { label, value } ) => (
		<button type="button" data-value={ value }>
			{ label }
		</button>
	),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn( () => null ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
	sprintf: ( fmt, ...args ) => {
		let i = 0;
		return fmt.replace( /%s/g, () => args[ i++ ] );
	},
} ) );

describe( 'deriveVariation', () => {
	afterEach( () => {
		delete globalThis.JetpackSearchBlocksConfig;
	} );

	it( 'maps the built-in (filterType, taxonomy) pairs to their variation ids', () => {
		expect( deriveVariation( { filterType: 'taxonomy', taxonomy: 'category' } ) ).toBe(
			VARIATION_CATEGORY
		);
		expect( deriveVariation( { filterType: 'taxonomy', taxonomy: 'post_tag' } ) ).toBe(
			VARIATION_POST_TAG
		);
		expect( deriveVariation( { filterType: 'post_type' } ) ).toBe( VARIATION_POST_TYPE );
		expect( deriveVariation( { filterType: 'author' } ) ).toBe( VARIATION_AUTHOR );
	} );

	it( 'maps the WC product taxonomy slugs to their dedicated variations on Woo sites', () => {
		globalThis.JetpackSearchBlocksConfig = { isWooCommerceActive: true };
		expect( deriveVariation( { filterType: 'taxonomy', taxonomy: 'product_cat' } ) ).toBe(
			VARIATION_PRODUCT_CAT
		);
		expect( deriveVariation( { filterType: 'taxonomy', taxonomy: 'product_tag' } ) ).toBe(
			VARIATION_PRODUCT_TAG
		);
		expect( deriveVariation( { filterType: 'taxonomy', taxonomy: 'product_brand' } ) ).toBe(
			VARIATION_PRODUCT_BRAND
		);
	} );

	it( 'collapses saved WC product slugs to Custom Taxonomy when WooCommerce is inactive', () => {
		// Mirrors the dormant-attribute pattern in results-list: the saved
		// attribute stays (re-activating WC restores the dedicated variation
		// next render), but the inspector picker collapses to a value that
		// still exists in `variationOptions()` so the SelectControl doesn't
		// try to render an option that isn't there.
		[ 'product_cat', 'product_tag', 'product_brand' ].forEach( taxonomy => {
			expect( deriveVariation( { filterType: 'taxonomy', taxonomy } ) ).toBe(
				VARIATION_CUSTOM_TAXONOMY
			);
		} );
	} );

	it( 'treats any non-built-in taxonomy slug as Custom Taxonomy', () => {
		expect( deriveVariation( { filterType: 'taxonomy', taxonomy: 'genre' } ) ).toBe(
			VARIATION_CUSTOM_TAXONOMY
		);
	} );

	it( 'falls back to Custom Taxonomy when filterType is empty (defensive)', () => {
		// block.json declares `filterType: 'taxonomy'` and `taxonomy: 'category'`
		// as defaults, so a freshly-inserted block always satisfies the Category
		// branch above. This guards a hypothetical legacy save where the
		// attributes are blank — the slug input shows up so the author can
		// recover, instead of misclassifying as a built-in variation.
		expect( deriveVariation( {} ) ).toBe( VARIATION_CUSTOM_TAXONOMY );
		expect( deriveVariation( { filterType: '', taxonomy: '' } ) ).toBe( VARIATION_CUSTOM_TAXONOMY );
	} );
} );

describe( 'variationOptions', () => {
	afterEach( () => {
		delete globalThis.JetpackSearchBlocksConfig;
	} );

	it( 'lists all eight variations when WooCommerce is active', () => {
		globalThis.JetpackSearchBlocksConfig = { isWooCommerceActive: true };
		expect( variationOptions().map( o => o.value ) ).toEqual( [
			VARIATION_CATEGORY,
			VARIATION_POST_TAG,
			VARIATION_POST_TYPE,
			VARIATION_AUTHOR,
			VARIATION_PRODUCT_CAT,
			VARIATION_PRODUCT_TAG,
			VARIATION_PRODUCT_BRAND,
			VARIATION_CUSTOM_TAXONOMY,
		] );
	} );

	it( 'drops the three product variations when WooCommerce is inactive', () => {
		expect( variationOptions().map( o => o.value ) ).toEqual( [
			VARIATION_CATEGORY,
			VARIATION_POST_TAG,
			VARIATION_POST_TYPE,
			VARIATION_AUTHOR,
			VARIATION_CUSTOM_TAXONOMY,
		] );
	} );

	it( 'drops the three product variations when the gate is explicitly false', () => {
		globalThis.JetpackSearchBlocksConfig = { isWooCommerceActive: false };
		const values = variationOptions().map( o => o.value );
		expect( values ).not.toContain( VARIATION_PRODUCT_CAT );
		expect( values ).not.toContain( VARIATION_PRODUCT_TAG );
		expect( values ).not.toContain( VARIATION_PRODUCT_BRAND );
	} );
} );

describe( 'variationToAttributes', () => {
	it( 'returns the canonical (filterType, taxonomy) pair for each built-in variation', () => {
		expect( variationToAttributes( VARIATION_CATEGORY, '' ) ).toEqual( {
			filterType: 'taxonomy',
			taxonomy: 'category',
		} );
		expect( variationToAttributes( VARIATION_POST_TAG, '' ) ).toEqual( {
			filterType: 'taxonomy',
			taxonomy: 'post_tag',
		} );
	} );

	it( 'preserves previousTaxonomy for Author and Post Type so Custom-slug round-trips survive', () => {
		// render.php ignores `taxonomy` when filterType isn't 'taxonomy', so
		// keeping the slug here is purely UI state — but it lets the author
		// flip Custom → Author → Custom without retyping `genre`.
		expect( variationToAttributes( VARIATION_POST_TYPE, 'genre' ) ).toEqual( {
			filterType: 'post_type',
			taxonomy: 'genre',
		} );
		expect( variationToAttributes( VARIATION_AUTHOR, 'genre' ) ).toEqual( {
			filterType: 'author',
			taxonomy: 'genre',
		} );
		expect( variationToAttributes( VARIATION_AUTHOR, '' ) ).toEqual( {
			filterType: 'author',
			taxonomy: '',
		} );
	} );

	it( 'pins the slug for the three product variations', () => {
		expect( variationToAttributes( VARIATION_PRODUCT_CAT, '' ) ).toEqual( {
			filterType: 'taxonomy',
			taxonomy: 'product_cat',
		} );
		expect( variationToAttributes( VARIATION_PRODUCT_TAG, 'genre' ) ).toEqual( {
			filterType: 'taxonomy',
			taxonomy: 'product_tag',
		} );
		expect( variationToAttributes( VARIATION_PRODUCT_BRAND, 'category' ) ).toEqual( {
			filterType: 'taxonomy',
			taxonomy: 'product_brand',
		} );
	} );

	it( 'preserves a custom slug when re-selecting Custom Taxonomy', () => {
		expect( variationToAttributes( VARIATION_CUSTOM_TAXONOMY, 'genre' ) ).toEqual( {
			filterType: 'taxonomy',
			taxonomy: 'genre',
		} );
	} );

	it( 'drops every built-in slug when switching to Custom Taxonomy', () => {
		// Otherwise these would surface as user-typed slugs in the Taxonomy
		// slug input, which would be wrong: they're built-in variations.
		[ 'category', 'post_tag', 'product_cat', 'product_tag', 'product_brand' ].forEach( slug => {
			expect( variationToAttributes( VARIATION_CUSTOM_TAXONOMY, slug ) ).toEqual( {
				filterType: 'taxonomy',
				taxonomy: '',
			} );
		} );
	} );

	it( 'falls through to Custom Taxonomy for unknown variation ids (defensive)', () => {
		expect( variationToAttributes( 'not-a-real-variation', 'genre' ) ).toEqual( {
			filterType: 'taxonomy',
			taxonomy: 'genre',
		} );
	} );

	it( 'preserves a custom slug across Custom → Author → Custom', () => {
		// Simulates the inspector workflow: user types `genre`, swaps to
		// Author, swaps back to Custom Taxonomy. The slug must come back.
		const step1 = variationToAttributes( VARIATION_CUSTOM_TAXONOMY, 'genre' );
		const step2 = variationToAttributes( VARIATION_AUTHOR, step1.taxonomy );
		const step3 = variationToAttributes( VARIATION_CUSTOM_TAXONOMY, step2.taxonomy );
		expect( step3.taxonomy ).toBe( 'genre' );
	} );

	it( 'preserves a custom slug across Custom → Post Type → Custom', () => {
		const step1 = variationToAttributes( VARIATION_CUSTOM_TAXONOMY, 'genre' );
		const step2 = variationToAttributes( VARIATION_POST_TYPE, step1.taxonomy );
		const step3 = variationToAttributes( VARIATION_CUSTOM_TAXONOMY, step2.taxonomy );
		expect( step3.taxonomy ).toBe( 'genre' );
	} );

	it( 'intentionally clears the slug across Custom → Category → Custom', () => {
		// Once the author swaps through Category, the stored taxonomy is
		// `category`, which we drop on the way back to avoid presenting it
		// as a custom-typed slug. Documented behavior, not a regression.
		const step1 = variationToAttributes( VARIATION_CUSTOM_TAXONOMY, 'genre' );
		const step2 = variationToAttributes( VARIATION_CATEGORY, step1.taxonomy );
		const step3 = variationToAttributes( VARIATION_CUSTOM_TAXONOMY, step2.taxonomy );
		expect( step3.taxonomy ).toBe( '' );
	} );

	it( 'intentionally clears the slug across Custom → Product Category → Custom', () => {
		const step1 = variationToAttributes( VARIATION_CUSTOM_TAXONOMY, 'genre' );
		const step2 = variationToAttributes( VARIATION_PRODUCT_CAT, step1.taxonomy );
		const step3 = variationToAttributes( VARIATION_CUSTOM_TAXONOMY, step2.taxonomy );
		expect( step3.taxonomy ).toBe( '' );
	} );
} );

describe( 'variationDefaultLabel', () => {
	it( 'returns the seeded variation label for each built-in variation', () => {
		expect( variationDefaultLabel( { filterType: 'taxonomy', taxonomy: 'category' } ) ).toBe(
			'Category'
		);
		expect( variationDefaultLabel( { filterType: 'taxonomy', taxonomy: 'post_tag' } ) ).toBe(
			'Tag'
		);
		expect( variationDefaultLabel( { filterType: 'post_type' } ) ).toBe( 'Post Type' );
		expect( variationDefaultLabel( { filterType: 'author' } ) ).toBe( 'Author' );
	} );

	it( 'returns distinct "Product X" labels for the three product variations', () => {
		// Product taxonomies must read differently from the post-taxonomy
		// variations so an author with both Category and Product Category
		// on the same page sees two distinct headings by default.
		expect( variationDefaultLabel( { filterType: 'taxonomy', taxonomy: 'product_cat' } ) ).toBe(
			'Product Category'
		);
		expect( variationDefaultLabel( { filterType: 'taxonomy', taxonomy: 'product_tag' } ) ).toBe(
			'Product Tag'
		);
		expect( variationDefaultLabel( { filterType: 'taxonomy', taxonomy: 'product_brand' } ) ).toBe(
			'Product Brand'
		);
	} );

	it( 'returns empty string for custom taxonomies so the caller falls back to the generic placeholder', () => {
		expect( variationDefaultLabel( { filterType: 'taxonomy', taxonomy: 'genre' } ) ).toBe( '' );
		expect( variationDefaultLabel( {} ) ).toBe( '' );
	} );
} );

describe( 'normalizeDisplayStyle', () => {
	it( 'defaults to checkbox-list for missing or unknown values', () => {
		expect( normalizeDisplayStyle() ).toBe( 'checkbox-list' );
		expect( normalizeDisplayStyle( 'bogus' ) ).toBe( 'checkbox-list' );
		expect( normalizeDisplayStyle( 'checkbox-list' ) ).toBe( 'checkbox-list' );
	} );

	it( 'accepts chips', () => {
		expect( normalizeDisplayStyle( 'chips' ) ).toBe( 'chips' );
	} );
} );

describe( 'FilterCheckboxEdit custom taxonomy picker', () => {
	const useSelectMock = jest.requireMock( '@wordpress/data' ).useSelect;

	afterEach( () => {
		delete globalThis.JetpackSearchBlocksConfig;
		useSelectMock.mockReset();
		useSelectMock.mockImplementation( () => null );
	} );

	const taxonomyEntities = [
		{ slug: 'genre', name: 'Genre', visibility: { public: true } },
		{ slug: 'mood', name: 'Mood', visibility: { public: true } },
		{ slug: 'private-thing', name: 'Private Thing', visibility: { public: true } },
	];

	it( 'restricts the picker to taxonomies present in supportedCustomTaxonomies', () => {
		// The picker used to list every public taxonomy from core-data, but
		// Jetpack Search only indexes a curated set — non-indexed taxonomies
		// would build a filter that silently returns zero buckets. The new
		// whitelist (server-derived from the index allowlist + map keys)
		// drops `private-thing` because it's not in either set.
		globalThis.JetpackSearchBlocksConfig = {
			supportedCustomTaxonomies: [ 'genre', 'mood' ],
			customTaxonomyMap: {},
		};
		useSelectMock.mockImplementation( () => taxonomyEntities );

		render(
			<FilterCheckboxEdit
				attributes={ { filterType: 'taxonomy', taxonomy: '' } }
				setAttributes={ jest.fn() }
			/>
		);

		const taxonomySelect = screen.getByLabelText( 'Taxonomy' );
		const visibleLabels = Array.from( taxonomySelect.options ).map( o => o.textContent );
		expect( visibleLabels ).toContain( 'Genre' );
		expect( visibleLabels ).toContain( 'Mood' );
		expect( visibleLabels ).not.toContain( 'Private Thing' );
	} );

	it( 'appends "(mapped)" to taxonomies routed through a reserved slot', () => {
		// The map's user-facing keys still surface in the picker, but with
		// a label suffix so authors know the filter routes through a
		// `jetpack-search-tagN` slot rather than the taxonomy itself.
		// `mood` is supported via the native allowlist, `genre` only via
		// the map — both appear; only `genre` gets the suffix.
		globalThis.JetpackSearchBlocksConfig = {
			supportedCustomTaxonomies: [ 'genre', 'mood' ],
			customTaxonomyMap: { genre: 'jetpack-search-tag1' },
		};
		useSelectMock.mockImplementation( () => taxonomyEntities );

		render(
			<FilterCheckboxEdit
				attributes={ { filterType: 'taxonomy', taxonomy: '' } }
				setAttributes={ jest.fn() }
			/>
		);

		const taxonomySelect = screen.getByLabelText( 'Taxonomy' );
		const visibleLabels = Array.from( taxonomySelect.options ).map( o => o.textContent );
		expect( visibleLabels ).toContain( 'Genre (mapped)' );
		expect( visibleLabels ).toContain( 'Mood' );
		expect( visibleLabels ).not.toContain( 'Genre' );
	} );

	it( 'shows the empty-state help text when no supported taxonomies exist on the site', () => {
		globalThis.JetpackSearchBlocksConfig = {
			supportedCustomTaxonomies: [],
			customTaxonomyMap: {},
		};
		useSelectMock.mockImplementation( () => [] );

		render(
			<FilterCheckboxEdit
				attributes={ { filterType: 'taxonomy', taxonomy: '' } }
				setAttributes={ jest.fn() }
			/>
		);

		expect( screen.getByText( /jetpack_search_custom_taxonomy_map/ ) ).toBeInTheDocument();
	} );
} );

describe( 'FilterCheckboxEdit display style preview', () => {
	it( 'renders the chip-mode preview DOM shape', () => {
		render(
			<FilterCheckboxEdit
				attributes={ {
					filterType: 'taxonomy',
					taxonomy: 'category',
					displayStyle: 'chips',
					showCount: true,
					maxItems: 2,
				} }
				setAttributes={ jest.fn() }
			/>
		);

		expect( screen.getAllByRole( 'listitem' ) ).toMatchInlineSnapshot( `
			[
			  <li
			    class="jetpack-search-filter__item"
			  >
			    <label>
			      <input
			        disabled=""
			        type="checkbox"
			      />
			      <span
			        class="jetpack-search-filter__label"
			      >
			        First option
			      </span>
			      <span
			        class="jetpack-search-filter__count"
			      >
			        24
			      </span>
			    </label>
			  </li>,
			  <li
			    class="jetpack-search-filter__item"
			  >
			    <label>
			      <input
			        disabled=""
			        type="checkbox"
			      />
			      <span
			        class="jetpack-search-filter__label"
			      >
			        Second option
			      </span>
			      <span
			        class="jetpack-search-filter__count"
			      >
			        12
			      </span>
			    </label>
			  </li>,
			]
		` );
	} );
} );
