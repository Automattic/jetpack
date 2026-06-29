/**
 * Editor preview for jetpack-search/search-input.
 *
 * Mirrors render.php's full structure — screen-reader label, icon, input,
 * and the (initially hidden) clear button — so designers can target every
 * CSS hook. The inspector exposes the three authoring knobs the front-end
 * honours: placeholder copy, whether the magnifying-glass icon renders,
 * and whether queries fire live or only on submit.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	CheckboxControl,
	Notice,
	PanelBody,
	TextControl,
	ToggleControl,
	__experimentalUnitControl as UnitControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Width control constants mirror `core/search`'s defaults so authors get the
// same feel across the two blocks (`packages/block-library/src/search/utils.js`).
// `MIN_WIDTH` is the px floor for any non-percentage unit — below ~220 px the
// field can't reliably show a useful placeholder + clear button.
const MIN_WIDTH = 220;
const PX_WIDTH_DEFAULT = 350;
const PC_WIDTH_DEFAULT = 50;
const WIDTH_UNITS = [
	{ value: 'px', label: 'px', default: PX_WIDTH_DEFAULT },
	{ value: '%', label: '%', default: PC_WIDTH_DEFAULT },
];

/**
 * Whether a unit is the percentage unit. Used to clamp max=100 and to swap
 * `MIN_WIDTH` out of the way (a 220% width isn't meaningful).
 *
 * @param {string} unit - The unit symbol.
 * @return {boolean} True for '%'.
 */
function isPercentageUnit( unit ) {
	return unit === '%';
}

// Mirrors the enum on `block.json::attributes.suggestionTypes.items.enum`
// and the canonical order rendered by `suggestion-rows.js::TYPE_ORDER`.
// Keep these three in lockstep — a new type means an entry in each plus a
// matching label in `Search_Blocks::build_initial_strings()`.
const SUGGESTION_TYPES = [
	{ value: 'query', label: __( 'Query completions', 'jetpack-search-pkg' ) },
	{ value: 'taxonomy', label: __( 'Categories & tags', 'jetpack-search-pkg' ) },
	{ value: 'post', label: __( 'Post titles', 'jetpack-search-pkg' ) },
];
const DEFAULT_SUGGESTION_TYPES = SUGGESTION_TYPES.map( t => t.value );

// `<fieldset>` carries the right group semantics but browsers apply default
// border, padding, and inline-size constraints that wreck the inspector's
// layout, and the WP component classes don't fully override them when applied
// to a `<legend>` (legend has its own browser typography). Lock the look in
// with inline-style resets so it matches the surrounding `components-base-control`
// blocks. Scoped to this one group rather than added to style.scss because the
// rest of the inspector renders fine with WP's defaults.
const FIELDSET_STYLE = {
	border: 0,
	padding: 0,
	margin: 0,
	marginTop: 16,
	minInlineSize: 'auto',
};
const LEGEND_STYLE = {
	display: 'block',
	width: '100%',
	margin: 0,
	marginBottom: 12,
	padding: 0,
	fontSize: 11,
	fontWeight: 500,
	lineHeight: 1.4,
	textTransform: 'uppercase',
	color: 'inherit',
};
const HELP_STYLE = {
	marginTop: 8,
	marginBottom: 0,
	fontSize: 12,
	fontStyle: 'normal',
	color: 'rgb(117, 117, 117)',
};

/**
 * Render the magnifying-glass glyph used by the search input, matching the
 * inline SVG emitted by render.php so the editor preview looks identical.
 *
 * @return {object} Rendered SVG element.
 */
function SearchGlyph() {
	return (
		<svg
			className="jetpack-search-input__icon"
			aria-hidden="true"
			focusable="false"
			xmlns="http://www.w3.org/2000/svg"
			width={ 24 }
			height={ 24 }
			viewBox="0 0 24 24"
		>
			<path d="M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6s-2.7-6-6-6zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" />
		</svg>
	);
}

/**
 * Edit component for the search-input block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function SearchInputEdit( { attributes, setAttributes } ) {
	// Width is opt-in: only emit the inline style when the author has set both
	// halves of the (value, unit) pair, mirroring `render_block_core_search`'s
	// `! empty( $width ) && ! empty( $widthUnit )` gate.
	const width = attributes?.width;
	const widthUnit = attributes?.widthUnit;
	const hasWidth = width !== undefined && width !== null && !! widthUnit;
	// `useBlockProps` drops a `style: undefined` entry on its own, so no need
	// to gate the call on `wrapperStyle` — keeps the call site to one line.
	const wrapperStyle = hasWidth ? { width: `${ width }${ widthUnit }` } : undefined;
	const blockProps = useBlockProps( { style: wrapperStyle } );
	// Per-instance id keeps the label→input association valid when the editor
	// renders more than one Search Input on the same canvas.
	const inputId = useId();
	const widthInputId = useId();
	const defaultPlaceholder = __( 'Search…', 'jetpack-search-pkg' );
	// Match render.php: a whitespace-only placeholder falls back to the
	// translated default in the preview so the editor mirrors the front end.
	const placeholder = ( attributes?.placeholder || '' ).trim() || defaultPlaceholder;
	const showIcon = attributes?.showIcon !== false;
	const submitOnly = !! attributes?.submitOnly;
	const enableSuggestions = !! attributes?.enableSuggestions;
	// Defensive copy so toggling a checkbox always produces a fresh array —
	// React-style setAttributes shallow-compares arrays by reference, and a
	// mutation in-place would skip the save. Falls back to the canonical
	// default list when the attribute is missing on freshly-inserted blocks
	// (block.json's default applies on next save, not first render).
	const suggestionTypes = Array.isArray( attributes?.suggestionTypes )
		? attributes.suggestionTypes
		: DEFAULT_SUGGESTION_TYPES;
	// Filter against DEFAULT_SUGGESTION_TYPES on every save so two blocks
	// that ended up with the same selection serialize identically regardless
	// of click order.
	const setSuggestionType = ( type, value ) => {
		const set = new Set( suggestionTypes );
		if ( value ) {
			set.add( type );
		} else {
			set.delete( type );
		}
		setAttributes( {
			suggestionTypes: DEFAULT_SUGGESTION_TYPES.filter( t => set.has( t ) ),
		} );
	};
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Placeholder', 'jetpack-search-pkg' ) }
						value={ attributes?.placeholder || '' }
						placeholder={ defaultPlaceholder }
						onChange={ value => setAttributes( { placeholder: value } ) }
						help={ __(
							'Leave empty to use the default translated placeholder.',
							'jetpack-search-pkg'
						) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show search icon', 'jetpack-search-pkg' ) }
						checked={ showIcon }
						onChange={ value => setAttributes( { showIcon: value } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Search on submit only', 'jetpack-search-pkg' ) }
						checked={ submitOnly }
						onChange={ value => setAttributes( { submitOnly: value } ) }
						help={ __(
							'When enabled, queries fire on Enter or when clearing the field, instead of on every keystroke.',
							'jetpack-search-pkg'
						) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show search suggestions', 'jetpack-search-pkg' ) }
						checked={ enableSuggestions }
						onChange={ value => setAttributes( { enableSuggestions: value } ) }
						help={ __(
							'Display an autocomplete dropdown as the visitor types. Requires a configured Jetpack Search site ID.',
							'jetpack-search-pkg'
						) }
					/>
					{ enableSuggestions && (
						// `<fieldset>` + `<legend>` instead of `BaseControl`'s label/id pair so
						// assistive tech announces the checkbox group correctly. BaseControl
						// only associates one focusable child with its label — a group of
						// three checkboxes needs the native group semantics.
						<fieldset className="components-base-control" style={ FIELDSET_STYLE }>
							<legend className="components-base-control__label" style={ LEGEND_STYLE }>
								{ __( 'Suggestion types', 'jetpack-search-pkg' ) }
							</legend>
							{ SUGGESTION_TYPES.map( ( { value, label } ) => (
								<CheckboxControl
									__nextHasNoMarginBottom
									key={ value }
									label={ label }
									checked={ suggestionTypes.includes( value ) }
									onChange={ checked => setSuggestionType( value, checked ) }
								/>
							) ) }
							{ suggestionTypes.length === 0 && (
								<Notice status="info" isDismissible={ false }>
									{ __(
										'No types selected — the dropdown won’t appear until at least one is enabled.',
										'jetpack-search-pkg'
									) }
								</Notice>
							) }
							<p className="components-base-control__help" style={ HELP_STYLE }>
								{ __( 'Pick which sections appear in the dropdown.', 'jetpack-search-pkg' ) }
							</p>
						</fieldset>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Dimensions', 'jetpack-search-pkg' ) } initialOpen={ false }>
					{ /* Mirrors core/search's width control — UnitControl with px / %
						units, MIN_WIDTH floor on non-percentage units, max=100 on %.
						Switching units snaps to a sensible default (350 px ↔ 50 %)
						so a 350 → % transition doesn't leave a meaningless 350%. */ }
					<UnitControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Width', 'jetpack-search-pkg' ) }
						id={ widthInputId }
						min={ isPercentageUnit( widthUnit ) ? 0 : MIN_WIDTH }
						max={ isPercentageUnit( widthUnit ) ? 100 : undefined }
						step={ 1 }
						units={ WIDTH_UNITS }
						value={ hasWidth ? `${ width }${ widthUnit }` : '' }
						onChange={ newValue => {
							if ( ! newValue ) {
								setAttributes( { width: undefined, widthUnit: undefined } );
								return;
							}
							// UnitControl emits a concatenated string like `300px` — the
							// number plus its currently-selected unit. Save BOTH halves
							// on every keystroke; without this, `width` lands but
							// `widthUnit` only sets through `onUnitChange` (which fires
							// only on explicit unit-picker changes). Fall back to the
							// existing widthUnit, then to the first unit in WIDTH_UNITS,
							// so the very first keystroke on a fresh block persists a
							// usable pair.
							const parsed = parseInt( newValue, 10 );
							const unitMatch = String( newValue ).match( /[^\d.]+$/ );
							const unit = unitMatch?.[ 0 ] || widthUnit || WIDTH_UNITS[ 0 ].value;
							setAttributes( {
								width: Number.isNaN( parsed ) ? undefined : parsed,
								widthUnit: unit,
							} );
						} }
						onUnitChange={ newUnit => {
							setAttributes( {
								width: isPercentageUnit( newUnit ) ? PC_WIDTH_DEFAULT : PX_WIDTH_DEFAULT,
								widthUnit: newUnit,
							} );
						} }
					/>
					<p className="components-base-control__help" style={ HELP_STYLE }>
						{ __( 'Leave empty to use the full container width.', 'jetpack-search-pkg' ) }
					</p>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<label className="jetpack-search-input__label screen-reader-text" htmlFor={ inputId }>
					{ __( 'Search', 'jetpack-search-pkg' ) }
				</label>
				<div className="jetpack-search-input__inside-wrapper">
					{ showIcon && <SearchGlyph /> }
					<input
						id={ inputId }
						type="search"
						className="jetpack-search-input__field"
						placeholder={ placeholder }
						disabled
						readOnly
					/>
					<button
						type="button"
						className="jetpack-search-input__clear"
						hidden
						disabled
						aria-label={ __( 'Clear search', 'jetpack-search-pkg' ) }
					>
						✕
					</button>
				</div>
			</div>
		</>
	);
}
