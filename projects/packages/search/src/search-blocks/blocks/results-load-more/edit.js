/**
 * Editor preview for jetpack-search/results-load-more.
 *
 * The inner button carries `wp-block-button__link` + `wp-element-button` so
 * it picks up the theme's full core/button look (border-radius, hover, etc.)
 * — and a "Compact" block style trims padding/font for themes whose button
 * baseline is too large. Includes the (hidden) loading-spinner span
 * render.php emits so the `.jetpack-search-load-more__spinner` CSS hook is
 * available to style. The Inspector exposes a text input for the
 * `buttonLabel` attribute, a toggle for `loadOnScroll` (auto-load on
 * scroll), and a range for how early the auto-load fires. When auto-load is
 * on the front end skips the button entirely (the IntersectionObserver
 * handles pagination), so the preview swaps to a spinner-only state and the
 * button-label control hides — the saved value stays around for when the
 * author flips the toggle back off.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, RangeControl, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Edit component for the load-more block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function LoadMoreEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const defaultLabel = __( 'Load more results', 'jetpack-search-pkg' );
	// Match render.php: a whitespace-only label falls back to the default
	// in the preview so the editor mirrors the front-end behaviour the
	// "Leave empty…" help text describes. The raw input is still stored.
	const buttonLabel = ( attributes?.buttonLabel || '' ).trim() || defaultLabel;
	const loadOnScroll = !! attributes?.loadOnScroll;
	const loadOnScrollOffset = Number.isFinite( attributes?.loadOnScrollOffset )
		? attributes.loadOnScrollOffset
		: 200;
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Load on scroll', 'jetpack-search-pkg' ) }
						help={ __(
							'Automatically load more results as the visitor scrolls toward the end of the list.',
							'jetpack-search-pkg'
						) }
						checked={ loadOnScroll }
						onChange={ value => setAttributes( { loadOnScroll: value } ) }
					/>
					{ loadOnScroll && (
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Load distance', 'jetpack-search-pkg' ) }
							help={ __(
								'Pixels before the bottom of the list at which the next page starts loading.',
								'jetpack-search-pkg'
							) }
							value={ loadOnScrollOffset }
							min={ 0 }
							max={ 2000 }
							step={ 50 }
							onChange={ value =>
								setAttributes( {
									loadOnScrollOffset: Number.isFinite( value ) ? value : 200,
								} )
							}
						/>
					) }
					{ ! loadOnScroll && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Button label', 'jetpack-search-pkg' ) }
							value={ attributes?.buttonLabel || '' }
							placeholder={ defaultLabel }
							onChange={ value => setAttributes( { buttonLabel: value } ) }
							help={ __(
								'Leave empty to use the default translated label.',
								'jetpack-search-pkg'
							) }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ loadOnScroll ? (
					<span className="jetpack-search-load-more__spinner">
						{ __( 'Loading…', 'jetpack-search-pkg' ) }
					</span>
				) : (
					<>
						<button
							type="button"
							className="jetpack-search-load-more__button wp-block-button__link wp-element-button"
							disabled
						>
							{ buttonLabel }
						</button>
						<span className="jetpack-search-load-more__spinner" hidden>
							{ __( 'Loading…', 'jetpack-search-pkg' ) }
						</span>
					</>
				) }
			</div>
		</>
	);
}
