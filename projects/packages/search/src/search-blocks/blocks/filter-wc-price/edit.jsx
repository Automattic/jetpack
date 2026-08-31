/**
 * Editor preview for jetpack-search/filter-wc-price.
 *
 * Two layouts behind one block, controlled by `showSlider`. Filter mode
 * shows two disabled number inputs joined by an em-dash; slider mode adds a
 * dual-thumb track preview above the same number-input row.
 *
 * Mirrors the runtime DOM shape (and BEM class names) `render.php` emits so
 * designers can style either preview in place. The inspector reveals the
 * "Slider range" panel only in slider mode — `showSlider` flips via a
 * ToggleControl at the top.
 *
 * When the author leaves the symbol / position blank we fall through to
 * whatever WooCommerce is configured for this site, so an AUD store gets
 * `A$` and an SEK store gets `100 kr` out of the box.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
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
 * Edit component for the filter-wc-price block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FilterWcPriceEdit( { attributes, setAttributes } ) {
	const showSlider = !! attributes?.showSlider;
	const wrapperClass = showSlider
		? 'jetpack-search-filter-wc-price jetpack-search-filter-wc-price--with-slider'
		: 'jetpack-search-filter-wc-price';
	const blockProps = useBlockProps( { className: wrapperClass } );
	const wcDefaults = getWcDefaults();
	const rawLabel = attributes?.label || '';
	const previewLabel = rawLabel || DEFAULT_LABEL;
	const effectiveSymbol = ( attributes?.currencySymbol || wcDefaults.symbol ).slice( 0, 2 );
	const effectivePosition = attributes?.currencySymbolPosition || wcDefaults.position;
	const fieldClass = `jetpack-search-filter-wc-price__field jetpack-search-filter-wc-price__field--${ effectivePosition }`;
	const min = Number.isFinite( attributes?.min ) ? attributes.min : 0;
	const max = Number.isFinite( attributes?.max ) ? attributes.max : 1000;
	const step = Number.isFinite( attributes?.step ) && attributes.step > 0 ? attributes.step : 1;
	const autoBounds = attributes?.autoBounds !== false;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show slider', 'jetpack-search-pkg' ) }
						checked={ showSlider }
						onChange={ value => setAttributes( { showSlider: !! value } ) }
						help={ __(
							'Adds a draggable range slider above the number inputs. Mirrors WooCommerce Blocks’ price slider.',
							'jetpack-search-pkg'
						) }
					/>
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
				{ showSlider && (
					<PanelBody title={ __( 'Slider range', 'jetpack-search-pkg' ) }>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Auto-detect range from store', 'jetpack-search-pkg' ) }
							checked={ autoBounds }
							onChange={ value => setAttributes( { autoBounds: !! value } ) }
							help={ __(
								'When enabled, the slider bounds match the store’s actual minimum and maximum product price. Disable to set the range manually.',
								'jetpack-search-pkg'
							) }
						/>
						{ ! autoBounds && min >= max && (
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
							disabled={ autoBounds }
							onChange={ value => setAttributes( { min: Math.max( 0, Number( value ) || 0 ) } ) }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min={ 0 }
							label={ __( 'Maximum', 'jetpack-search-pkg' ) }
							value={ String( max ) }
							disabled={ autoBounds }
							onChange={ value => setAttributes( { max: Math.max( 0, Number( value ) || 0 ) } ) }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min={ 0 }
							label={ __( 'Step', 'jetpack-search-pkg' ) }
							value={ String( step ) }
							onChange={ value => setAttributes( { step: Math.max( 0, Number( value ) || 1 ) } ) }
							help={ __( 'Slider granularity.', 'jetpack-search-pkg' ) }
						/>
					</PanelBody>
				) }
			</InspectorControls>
			<div { ...blockProps }>
				<h3 className="jetpack-search-filter__title">{ previewLabel }</h3>
				{ showSlider && (
					<div
						className="jetpack-search-filter-wc-price__slider"
						style={ { '--low': '0%', '--high': '100%' } }
					>
						<div className="jetpack-search-filter-wc-price__slider-bar" />
						<input
							className="jetpack-search-filter-wc-price__slider-input jetpack-search-filter-wc-price__slider-input--min"
							type="range"
							min={ min }
							max={ max }
							step={ step }
							defaultValue={ min }
							disabled
						/>
						<input
							className="jetpack-search-filter-wc-price__slider-input jetpack-search-filter-wc-price__slider-input--max"
							type="range"
							min={ min }
							max={ max }
							step={ step }
							defaultValue={ max }
							disabled
						/>
					</div>
				) }
				<div className="jetpack-search-filter-wc-price__inputs">
					<div className={ fieldClass }>
						<span className="jetpack-search-filter-wc-price__symbol" aria-hidden="true">
							{ effectiveSymbol }
						</span>
						<input
							className="jetpack-search-filter-wc-price__input jetpack-search-filter-wc-price__input--min"
							type="number"
							placeholder={ __( 'Min', 'jetpack-search-pkg' ) }
							disabled
						/>
					</div>
					<span className="jetpack-search-filter-wc-price__separator" aria-hidden="true">
						–
					</span>
					<div className={ fieldClass }>
						<span className="jetpack-search-filter-wc-price__symbol" aria-hidden="true">
							{ effectiveSymbol }
						</span>
						<input
							className="jetpack-search-filter-wc-price__input jetpack-search-filter-wc-price__input--max"
							type="number"
							placeholder={ __( 'Max', 'jetpack-search-pkg' ) }
							disabled
						/>
					</div>
				</div>
			</div>
		</>
	);
}
