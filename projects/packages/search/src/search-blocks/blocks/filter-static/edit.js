/**
 * Editor preview for jetpack-search/filter-static.
 *
 * The block's option list is supplied by the host site through the
 * `jetpack_search_static_filters` (or legacy `jetpack_instant_search_options`)
 * PHP filter — there are no per-instance values to edit. The inspector exposes
 * the three block-level attributes (variation, label override, optional
 * scoping to a single filter_id) and a SelectControl that lists the currently
 * registered filters via a REST round-trip so authors can confirm what their
 * filter hook returns without leaving the editor.
 */
import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	Placeholder,
	SelectControl,
	TextControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

const SAMPLE_OPTIONS = [
	{ value: 'one', label: __( 'First option', 'jetpack-search-pkg' ) },
	{ value: 'two', label: __( 'Second option', 'jetpack-search-pkg' ) },
	{ value: 'three', label: __( 'Third option', 'jetpack-search-pkg' ) },
];

/**
 * Coerce a saved `variation` value to the supported enum. Mirrors
 * `Filter_Static::normalize_variation()` on the PHP side — both must agree or
 * the editor preview and the server-rendered front end would scope to
 * different filter subsets.
 *
 * @param {unknown} value - Raw attribute value.
 * @return {'sidebar' | 'tabbed'} Normalized variant.
 */
export function normalizeVariation( value ) {
	return value === 'tabbed' ? 'tabbed' : 'sidebar';
}

/**
 * Edit component for the filter-static block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FilterStaticEdit( { attributes, setAttributes } ) {
	const variation = normalizeVariation( attributes?.variation );
	const filterId = attributes?.filterId || '';
	const rawLabel = attributes?.label || '';
	const blockProps = useBlockProps( { 'data-variation': variation } );

	// Pull the current static-filter registration from the REST surface so the
	// author can see (and pick from) the live list. `loading === null` is the
	// pre-fetch sentinel; `[]` means the fetch resolved but the site has no
	// static filters registered for this variation, which is the empty-state
	// Placeholder branch below. Re-fetch when the variation changes so the
	// picker only ever lists filters that would render at this surface.
	const [ entries, setEntries ] = useState( null );
	const [ fetchError, setFetchError ] = useState( false );
	useEffect( () => {
		let cancelled = false;
		setFetchError( false );
		apiFetch( {
			path: addQueryArgs( '/jetpack-search/v1/static-filters', { variation } ),
		} )
			.then( data => {
				if ( cancelled ) {
					return;
				}
				setEntries( Array.isArray( data ) ? data : [] );
			} )
			.catch( () => {
				if ( cancelled ) {
					return;
				}
				setEntries( [] );
				setFetchError( true );
			} );
		return () => {
			cancelled = true;
		};
	}, [ variation ] );

	const isLoading = entries === null;
	const hasEntries = Array.isArray( entries ) && entries.length > 0;
	const selectedEntry =
		hasEntries && filterId ? entries.find( e => e.filter_id === filterId ) || null : null;

	// Build the SelectControl options. The empty-string value ("All") tells
	// render.php to surface every registered filter for the current variation
	// — that's the default scoping, useful for sites that only have one
	// static filter and want the block to render it without an extra pick.
	const filterIdOptions = [
		{ value: '', label: __( 'All registered filters', 'jetpack-search-pkg' ) },
		...( hasEntries
			? entries.map( e => ( {
					value: e.filter_id,
					label: e.name || e.filter_id,
			  } ) )
			: [] ),
	];

	const previewLabel =
		rawLabel || ( selectedEntry && selectedEntry.name ) || __( 'Filter', 'jetpack-search-pkg' );

	// Render an empty-state Placeholder when the fetch resolved but the site
	// has no static filters registered. Avoids the misleading sample-radio
	// preview making the block look configured when it would render nothing
	// on the front end.
	const showEmptyState = ! isLoading && ! hasEntries;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Variation', 'jetpack-search-pkg' ) }
						value={ variation }
						onChange={ value => setAttributes( { variation: normalizeVariation( value ) } ) }
						help={ __(
							'Scopes this block to filters registered with the matching variation.',
							'jetpack-search-pkg'
						) }
					>
						<ToggleGroupControlOption
							value="sidebar"
							label={ __( 'Sidebar', 'jetpack-search-pkg' ) }
						/>
						<ToggleGroupControlOption
							value="tabbed"
							label={ __( 'Tabbed', 'jetpack-search-pkg' ) }
						/>
					</ToggleGroupControl>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Filter', 'jetpack-search-pkg' ) }
						value={ filterId }
						options={ filterIdOptions }
						disabled={ ! hasEntries }
						onChange={ value => setAttributes( { filterId: value } ) }
						help={
							isLoading
								? __( 'Loading registered filters…', 'jetpack-search-pkg' )
								: __(
										'Pick a specific filter, or leave on "All" to render every filter registered for this variation.',
										'jetpack-search-pkg',
										/* dummy arg to avoid bad minification */ 0
								  )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Label', 'jetpack-search-pkg' ) }
						value={ rawLabel }
						placeholder={ previewLabel }
						onChange={ value => setAttributes( { label: value } ) }
						help={ __(
							'Override the server-supplied filter name. Leave empty to use the registered name.',
							'jetpack-search-pkg'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ showEmptyState ? (
					<Placeholder
						icon="filter"
						label={ __( 'Static Filter', 'jetpack-search-pkg' ) }
						instructions={
							fetchError
								? __(
										"Couldn't reach the static-filter REST endpoint. The block will still render on the front end if filters are registered via the jetpack_search_static_filters PHP filter.",
										'jetpack-search-pkg'
								  )
								: __(
										'No static filters are registered for this variation. Register one via the jetpack_search_static_filters PHP filter to populate this block.',
										'jetpack-search-pkg',
										/* dummy arg to avoid bad minification */ 0
								  )
						}
					/>
				) : (
					<fieldset className="jetpack-search-filter__group">
						<legend className="jetpack-search-filter__title">{ previewLabel }</legend>
						<ul className="jetpack-search-filter__list">
							{ SAMPLE_OPTIONS.map( ( option, index ) => (
								<li key={ option.value } className="jetpack-search-filter__item">
									{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- the input is a direct child, implicit HTML5 association applies */ }
									<label>
										<input
											type="radio"
											name="jetpack-search-filter-static-preview"
											defaultChecked={ index === 0 }
											disabled
										/>
										<span className="jetpack-search-filter__label">{ option.label }</span>
									</label>
								</li>
							) ) }
						</ul>
					</fieldset>
				) }
			</div>
		</>
	);
}
