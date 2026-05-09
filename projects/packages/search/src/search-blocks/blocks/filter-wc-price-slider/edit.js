/**
 * Editor preview for jetpack-search/filter-wc-price-slider.
 *
 * Mirrors the runtime DOM shape — single shared track, two overlaid disabled
 * `<input type="range">` thumbs (lower = min, upper = max), value labels
 * flanking the track — so designers can style the slider in place. The author
 * bounds the slider via `min` / `max` / `step` attrs so the visual range fits
 * the store's actual price distribution; sizing the slider from a live
 * aggregation is deferred to a follow-up.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Notice, PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DEFAULT_LABEL = __( 'Price', 'jetpack-search-pkg' );

/**
 * Read currency symbol + position from `window.wcSettings.currency` (set by
 * WooCommerce's `wc-settings` script). When WC isn't loaded these defaults
 * keep the editor renderable on a plain WP install.
 *
 * @return {{symbol: string, position: 'left'|'right'}} Effective WC defaults.
 */
function getWcDefaults() {
	const currency = ( typeof window !== 'undefined' && window.wcSettings?.currency ) || {};
	const rawPos = String( currency.position || 'left' );
	return {
		symbol: String( currency.symbol || '$' ),
		position: rawPos.startsWith( 'right' ) ? 'right' : 'left',
	};
}

/**
 * Edit component for the filter-wc-price-slider block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FilterWcPriceSliderEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-filter-wc-price-slider' } );
	const wcDefaults = getWcDefaults();
	const rawLabel = attributes?.label || '';
	const previewLabel = rawLabel || DEFAULT_LABEL;
	const effectiveSymbol = ( attributes?.currencySymbol || wcDefaults.symbol ).slice( 0, 2 );
	const effectivePosition = attributes?.currencySymbolPosition || wcDefaults.position;
	const min = Number.isFinite( attributes?.min ) ? attributes.min : 0;
	const max = Number.isFinite( attributes?.max ) ? attributes.max : 1000;
	const step = Number.isFinite( attributes?.step ) && attributes.step > 0 ? attributes.step : 1;
	const formatBound = value =>
		effectivePosition === 'right'
			? `${ value }${ effectiveSymbol }`
			: `${ effectiveSymbol }${ value }`;

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
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Currency symbol', 'jetpack-search-pkg' ) }
						value={ attributes?.currencySymbol || '' }
						placeholder={ wcDefaults.symbol }
						maxLength={ 2 }
						onChange={ value => setAttributes( { currencySymbol: value } ) }
						help={ __(
							'Leave blank to use the active WooCommerce currency.',
							'jetpack-search-pkg'
						) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Symbol position', 'jetpack-search-pkg' ) }
						value={ attributes?.currencySymbolPosition || '' }
						options={ [
							{
								value: '',
								label: __( 'Default (WooCommerce)', 'jetpack-search-pkg' ),
							},
							{ value: 'left', label: __( 'Before amount', 'jetpack-search-pkg' ) },
							{ value: 'right', label: __( 'After amount', 'jetpack-search-pkg' ) },
						] }
						onChange={ value => setAttributes( { currencySymbolPosition: value } ) }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Slider range', 'jetpack-search-pkg' ) }>
					{ min >= max && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'Minimum must be less than maximum for the slider to render correctly.',
								'jetpack-search-pkg'
							) }
						</Notice>
					) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						label={ __( 'Minimum', 'jetpack-search-pkg' ) }
						value={ String( min ) }
						onChange={ value => setAttributes( { min: Number( value ) || 0 } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						label={ __( 'Maximum', 'jetpack-search-pkg' ) }
						value={ String( max ) }
						onChange={ value => setAttributes( { max: Number( value ) || 0 } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						label={ __( 'Step', 'jetpack-search-pkg' ) }
						value={ String( step ) }
						onChange={ value => setAttributes( { step: Number( value ) || 1 } ) }
						help={ __( 'Slider granularity.', 'jetpack-search-pkg' ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<h3 className="jetpack-search-filter__title">{ previewLabel }</h3>
				<div className="jetpack-search-filter-wc-price-slider__content">
					<div className="jetpack-search-filter-wc-price-slider__left">
						<span className="jetpack-search-filter-wc-price-slider__value jetpack-search-filter-wc-price-slider__value--min">
							{ formatBound( min ) }
						</span>
					</div>
					<div
						className="jetpack-search-filter-wc-price-slider__range"
						style={ { '--low': '0%', '--high': '100%' } }
					>
						<div className="jetpack-search-filter-wc-price-slider__range-bar" />
						<input
							className="jetpack-search-filter-wc-price-slider__input jetpack-search-filter-wc-price-slider__input--min"
							type="range"
							min={ min }
							max={ max }
							step={ step }
							defaultValue={ min }
							disabled
						/>
						<input
							className="jetpack-search-filter-wc-price-slider__input jetpack-search-filter-wc-price-slider__input--max"
							type="range"
							min={ min }
							max={ max }
							step={ step }
							defaultValue={ max }
							disabled
						/>
					</div>
					<div className="jetpack-search-filter-wc-price-slider__right">
						<span className="jetpack-search-filter-wc-price-slider__value jetpack-search-filter-wc-price-slider__value--max">
							{ formatBound( max ) }
						</span>
					</div>
				</div>
			</div>
		</>
	);
}
