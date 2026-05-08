/**
 * Editor preview for jetpack-search/filter-wc-stock-status.
 *
 * Mirrors the runtime DOM shape — labeled list with one checkbox option
 * and optional count badges — so designers can style the filter list in
 * place. Inspector exposes the user-tunable attributes (label, showCount).
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

// Mirror Search_Product_Filter_Status::get_options() — same value/label
// pairs so the editor preview matches the front-end render shape exactly.
// Sample count is illustrative; the live block renders real ES counts.
const SAMPLE_OPTIONS = [
	{ value: 'instock', label: __( 'In stock', 'jetpack-search-pkg' ), count: 24 },
];

const DEFAULT_LABEL = __( 'Stock status', 'jetpack-search-pkg' );

/**
 * Edit component for the filter-wc-stock-status block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FilterWcStockStatusEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-filter-wc-stock-status' } );
	const rawLabel = attributes?.label || '';
	const previewLabel = rawLabel || DEFAULT_LABEL;
	const showCount = attributes?.showCount !== false;

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
						help={ __(
							'Heading shown above the options. Leave empty for the default.',
							'jetpack-search-pkg'
						) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show result counts', 'jetpack-search-pkg' ) }
						checked={ showCount }
						onChange={ value => setAttributes( { showCount: !! value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<h3 className="jetpack-search-filter__title">{ previewLabel }</h3>
				<ul className="jetpack-search-filter__list">
					{ SAMPLE_OPTIONS.map( option => (
						<li key={ option.value } className="jetpack-search-filter__item">
							{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- the input is a direct child, implicit HTML5 association applies; rule's nesting heuristic doesn't trace through sibling spans */ }
							<label>
								<input type="checkbox" disabled />
								<span className="jetpack-search-filter__label">{ option.label }</span>
								{ showCount && (
									<span className="jetpack-search-filter__count">{ String( option.count ) }</span>
								) }
							</label>
						</li>
					) ) }
				</ul>
			</div>
		</>
	);
}
