/**
 * Editor preview for jetpack-search/filter-wc-price.
 *
 * Mirrors the runtime DOM shape — two disabled number inputs joined by
 * an em-dash — so designers can style the price field in place.
 * Inspector exposes the user-tunable attributes (label, currency symbol,
 * symbol position). When the author leaves the symbol/position blank we
 * fall through to whatever WooCommerce is configured for this site, so
 * an AUD store gets `A$` and an SEK store gets `100 kr` out of the box.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl } from '@wordpress/components';
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
	const blockProps = useBlockProps( { className: 'jetpack-search-filter-wc-price' } );
	const wcDefaults = getWcDefaults();
	const rawLabel = attributes?.label || '';
	const previewLabel = rawLabel || DEFAULT_LABEL;
	const effectiveSymbol = ( attributes?.currencySymbol || wcDefaults.symbol ).slice( 0, 2 );
	const effectivePosition = attributes?.currencySymbolPosition || wcDefaults.position;
	const fieldClass = `jetpack-search-filter-wc-price__field jetpack-search-filter-wc-price__field--${ effectivePosition }`;

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
			</InspectorControls>
			<div { ...blockProps }>
				<h3 className="jetpack-search-filter__title">{ previewLabel }</h3>
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
