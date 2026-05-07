/**
 * Editor preview for jetpack-search/results-sort.
 *
 * Mirrors the DOM shape of render.php so authors see the live block match
 * the `displayAs` / `availableSortOptions` / `label` / `defaultSort`
 * attributes without needing to flip to the front end. Pairs the label and
 * control via htmlFor/id so the preview has the same a11y semantics too.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { CheckboxControl, PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Mirror Results_Sort::BASE_SORT_KEYS. Product-format keys rejoin in RSM-1082.
const ALL_SORT_KEYS = [ 'relevance', 'newest', 'oldest' ];

/**
 * Translated human-readable labels for each sort key. Declared as a function
 * (rather than a module-level object) so the `__()` calls run after the
 * block editor's i18n is loaded — otherwise the strings would be cached in
 * the source locale on module init.
 *
 * @return {Object<string,string>} Map of sort key → label.
 */
function getSortLabels() {
	return {
		relevance: __( 'Relevance', 'jetpack-search-pkg' ),
		newest: __( 'Newest', 'jetpack-search-pkg' ),
		oldest: __( 'Oldest', 'jetpack-search-pkg' ),
	};
}

/**
 * Resolve the effective list of sort keys to render. Mirrors
 * `Results_Sort::resolve_available_options()` on the PHP side: unknown keys
 * drop, canonical order wins, and an empty list falls back to the full set
 * so a misconfigured block never shows a control with zero options.
 *
 * @param {string[]|undefined} stored - Saved `availableSortOptions` value.
 * @return {string[]} Ordered sort keys to render.
 */
function resolveAvailable( stored ) {
	if ( ! Array.isArray( stored ) ) {
		return ALL_SORT_KEYS;
	}
	const filtered = ALL_SORT_KEYS.filter( key => stored.includes( key ) );
	return filtered.length === 0 ? ALL_SORT_KEYS : filtered;
}

/**
 * Edit component for the results-sort block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function ResultsSortEdit( { attributes, setAttributes } ) {
	// Per-instance id keeps the label→control association valid when the
	// editor renders more than one Results Sort on the same canvas.
	const baseId = useId();

	const labels = getSortLabels();
	const defaultSort = ALL_SORT_KEYS.includes( attributes?.defaultSort )
		? attributes.defaultSort
		: 'relevance';
	let displayAs = 'select';
	if ( [ 'radio', 'popover' ].includes( attributes?.displayAs ) ) {
		displayAs = attributes.displayAs;
	} else if ( 'popover' === attributes?.display ) {
		displayAs = 'popover';
	}
	const blockProps = useBlockProps( {
		className: 'popover' === displayAs ? 'jetpack-search-results-sort--popover' : undefined,
	} );
	const storedAvailable = Array.isArray( attributes?.availableSortOptions )
		? attributes.availableSortOptions
		: ALL_SORT_KEYS;
	const available = resolveAvailable( storedAvailable );
	const labelText = ( attributes?.label || '' ).trim() || __( 'Sort by', 'jetpack-search-pkg' );

	// If the saved default no longer appears in `availableSortOptions` (e.g.
	// the author just unchecked it), fall back to the first visible option so
	// the preview reflects a value the dropdown can actually represent.
	const previewSelected = available.includes( defaultSort ) ? defaultSort : available[ 0 ];

	const toggleAvailable = ( sortKey, checked ) => {
		const next = checked
			? ALL_SORT_KEYS.filter( key => key === sortKey || storedAvailable.includes( key ) )
			: storedAvailable.filter( key => key !== sortKey );
		// Persisting `[]` would make the preview fall back to "all options"
		// (matching `resolveAvailable()` and the PHP renderer) while every
		// inspector checkbox stays unchecked — an inspector/preview mismatch
		// authors can't easily reason about. Snap the empty case back to the
		// canonical full set so the saved attribute always matches what
		// renders.
		const normalizedNext = next.length === 0 ? ALL_SORT_KEYS : next;
		// If the author just unchecked the current `defaultSort` AND it's no
		// longer in the saved set, move the attribute onto the first still-
		// available key in the same setAttributes call. Without this,
		// `defaultSort` would keep the stale value on disk — the render
		// callback falls back gracefully, but the editor's inspector would
		// re-bind to `available[0]` visually while the saved attribute still
		// held the unchecked key, which is confusing to reason about.
		const update = { availableSortOptions: normalizedNext };
		if ( ! checked && sortKey === defaultSort && ! normalizedNext.includes( defaultSort ) ) {
			update.defaultSort = normalizedNext[ 0 ];
		}
		setAttributes( update );
	};

	const inspector = (
		<InspectorControls>
			<PanelBody title={ __( 'Sort Settings', 'jetpack-search-pkg' ) }>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Label', 'jetpack-search-pkg' ) }
					value={ attributes?.label || '' }
					placeholder={ __( 'Sort by', 'jetpack-search-pkg' ) }
					onChange={ value => setAttributes( { label: value } ) }
					help={ __( 'Leave empty to use the default translated label.', 'jetpack-search-pkg' ) }
				/>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Default sort', 'jetpack-search-pkg' ) }
					// Use the `defaultSort` attribute when it's still in `available`
					// so the <select> stays bound to its persisted value. When the
					// author has just unchecked the current default from the list,
					// fall back to the first available option so the control binds
					// to something visible instead of rendering a blank selection.
					value={ available.includes( defaultSort ) ? defaultSort : available[ 0 ] }
					// Only offer keys the author has actually enabled. Showing the
					// full list here would let the author pick a default that
					// `availableSortOptions` excludes — the render callback already
					// falls back gracefully, but the editor would misleadingly show
					// a "saved default" the front end never honors.
					options={ available.map( key => ( { value: key, label: labels[ key ] } ) ) }
					onChange={ value => setAttributes( { defaultSort: value } ) }
					help={ __(
						'Applied on first load when the URL carries no sort parameter.',
						'jetpack-search-pkg'
					) }
				/>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Display as', 'jetpack-search-pkg' ) }
					value={ displayAs }
					options={ [
						{ value: 'select', label: __( 'Dropdown', 'jetpack-search-pkg' ) },
						{ value: 'radio', label: __( 'Inline links', 'jetpack-search-pkg' ) },
						{ value: 'popover', label: __( 'Popover', 'jetpack-search-pkg' ) },
					] }
					onChange={ value => setAttributes( { displayAs: value, display: undefined } ) }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Available options', 'jetpack-search-pkg' ) }>
				{ ALL_SORT_KEYS.map( key => (
					<CheckboxControl
						key={ key }
						__nextHasNoMarginBottom
						label={ labels[ key ] }
						checked={ storedAvailable.includes( key ) }
						onChange={ checked => toggleAvailable( key, checked ) }
					/>
				) ) }
			</PanelBody>
		</InspectorControls>
	);

	let preview;
	if ( 'popover' === displayAs ) {
		preview = (
			<button
				type="button"
				className="jetpack-search-results-sort__trigger"
				aria-haspopup="menu"
				aria-expanded="false"
				disabled
			>
				<svg
					className="jetpack-search-results-sort__icon"
					width={ 18 }
					height={ 18 }
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<path fill="currentColor" d="M8 4l-4 4h3v12h2V8h3L8 4zm8 16l4-4h-3V4h-2v12h-3l4 4z" />
				</svg>
				<span className="screen-reader-text">{ __( 'Sort results', 'jetpack-search-pkg' ) }</span>
			</button>
		);
	} else if ( 'radio' === displayAs ) {
		preview = (
			<fieldset className="jetpack-search-results-sort__radio-group">
				<legend>{ labelText }</legend>
				{ available.map( key => {
					const radioId = `${ baseId }-${ key }`;
					return (
						<div key={ key } className="jetpack-search-results-sort__radio-item">
							<input
								type="radio"
								id={ radioId }
								name={ baseId }
								value={ key }
								checked={ previewSelected === key }
								disabled
								readOnly
							/>
							<label htmlFor={ radioId }>{ labels[ key ] }</label>
						</div>
					);
				} ) }
			</fieldset>
		);
	} else {
		preview = (
			<>
				<label htmlFor={ baseId }>{ labelText }</label>
				<select id={ baseId } disabled value={ previewSelected } onChange={ () => {} }>
					{ available.map( key => (
						<option key={ key } value={ key }>
							{ labels[ key ] }
						</option>
					) ) }
				</select>
			</>
		);
	}

	return (
		<>
			{ inspector }
			<div { ...blockProps }>{ preview }</div>
		</>
	);
}
