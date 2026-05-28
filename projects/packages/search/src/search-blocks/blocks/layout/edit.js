/**
 * Editor preview for jetpack-search/layout.
 *
 * Group-like wrapper that frames the whole Search experience. Renders a
 * constrained-layout InnerBlocks region so alignwide/alignfull children
 * behave, and exposes a Width control (centered max-width) in the inspector.
 * Spacing, border, and dimensions come from block supports — forced on for
 * this block regardless of theme via a `wp_theme_json_data_theme` filter (see
 * Search_Blocks::force_search_layout_block_supports()).
 */
import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalUnitControl as UnitControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

// Width defaults sized for a page region rather than a single field: a typical
// content cap in px, a full-bleed default in %. `MIN_WIDTH` floors px so the
// search columns never collapse below a usable width.
const MIN_WIDTH = 320;
const PX_WIDTH_DEFAULT = 1100;
const PC_WIDTH_DEFAULT = 100;
const WIDTH_UNITS = [
	{ value: 'px', label: 'px', default: PX_WIDTH_DEFAULT },
	{ value: '%', label: '%', default: PC_WIDTH_DEFAULT },
];

// Only the top gap after the UnitControl — color, font-size, and font-style
// come from the `components-base-control__help` class (which also tracks WP's
// dark color scheme; a hardcoded color here would override it).
const HELP_STYLE = { marginTop: 8 };

/**
 * Whether a unit is the percentage unit. Used to clamp max=100 and to drop the
 * `MIN_WIDTH` floor (a 320% width isn't meaningful).
 *
 * @param {string} unit - The unit symbol.
 * @return {boolean} True for '%'.
 */
function isPercentageUnit( unit ) {
	return unit === '%';
}

/**
 * Edit component for the layout block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function LayoutEdit( { attributes, setAttributes } ) {
	// Width is opt-in: only emit the inline style when the author has set both
	// halves of the (value, unit) pair. The render emits a centered max-width,
	// so the editor preview mirrors it with the same logical centering.
	const width = attributes?.width;
	const widthUnit = attributes?.widthUnit;
	const hasWidth = width !== undefined && width !== null && !! widthUnit;
	const wrapperStyle = hasWidth
		? { maxWidth: `${ width }${ widthUnit }`, marginLeft: 'auto', marginRight: 'auto' }
		: undefined;
	const blockProps = useBlockProps( { style: wrapperStyle } );
	// Mirror core/group: fall back to constrained so alignwide/full children
	// center even on a freshly-inserted block whose layout attr is still unset.
	const layout = attributes?.layout;
	const usedLayout = layout?.type ? layout : { type: 'constrained' };
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		layout: usedLayout,
		renderAppender: InnerBlocks.ButtonBlockAppender,
	} );
	// Render the saved semantic tag so the preview matches render.php; the
	// templates set `main`, ad-hoc insertions default to `div` (no second
	// `<main>` landmark). Capitalized binding so JSX treats it as the element.
	const TagName = attributes?.tagName || 'div';
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Width', 'jetpack-search-pkg' ) } initialOpen={ false }>
					{ /* UnitControl with px / % units, MIN_WIDTH floor on non-percentage
						units, max=100 on %. Switching units snaps to a sensible default
						so a px → % transition doesn't leave a meaningless 1100%. */ }
					<UnitControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Width', 'jetpack-search-pkg' ) }
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
							// UnitControl emits a concatenated string like `900px`. Save
							// BOTH halves on every keystroke; without this, `width` lands
							// but `widthUnit` only sets through `onUnitChange` (which fires
							// only on explicit unit-picker changes). Fall back to the
							// existing unit, then the first in WIDTH_UNITS, so the very
							// first keystroke on a fresh block persists a usable pair.
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
			<TagName { ...innerBlocksProps } />
		</>
	);
}

export const save = () => <InnerBlocks.Content />;
