/**
 * Editor preview for jetpack-search/clear-filters.
 *
 * A neutral wrapper `<div>` is the block root (so it follows theme block
 * layout); the inner button carries `wp-block-button__link` + `wp-element-button`
 * so it picks up the theme's full core/button styling (border-radius, hover,
 * etc.) — but the `.wp-block-button` parent and `is-style-outline` are
 * deliberately omitted, since *those* were the source of the oversized
 * rendering on some themes. The "Compact" block style trims padding/font
 * for themes whose button baseline is still too large.
 *
 * Always renders the button at full opacity in the editor — the live block
 * hides itself when no filter is active, but a hidden affordance is hard to
 * style or position. The "hide when inactive" toggle in the inspector is
 * preview-only here; the runtime visibility binding is set in render.php.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DEFAULT_LABEL = __( 'Clear filters', 'jetpack-search-pkg' );

/**
 * Edit component for the clear-filters block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function ClearFiltersEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-clear-filters' } );
	const rawLabel = attributes.label || '';
	// Match render.php's sanitize_text_field() trim so a whitespace-only label
	// previews the default copy instead of a visually empty button.
	const previewLabel = rawLabel.trim() || DEFAULT_LABEL;
	const hideWhenInactive = attributes.hideWhenInactive !== false;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Label', 'jetpack-search-pkg' ) }
						value={ rawLabel }
						placeholder={ DEFAULT_LABEL }
						onChange={ value => setAttributes( { label: value } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Hide when no filter is active', 'jetpack-search-pkg' ) }
						checked={ hideWhenInactive }
						onChange={ value => setAttributes( { hideWhenInactive: !! value } ) }
						help={ __(
							'Reveal the button only once the shopper selects a filter or price range.',
							'jetpack-search-pkg'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<button
					type="button"
					className="jetpack-search-clear-filters__button wp-block-button__link wp-element-button"
					disabled
				>
					{ previewLabel }
				</button>
			</div>
		</>
	);
}
