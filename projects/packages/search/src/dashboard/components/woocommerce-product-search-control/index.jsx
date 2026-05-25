import analytics from '@automattic/jetpack-analytics';
import { ExternalLink, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';

const WOOCOMMERCE_PRODUCT_SEARCH_DESCRIPTION = __(
	"Render product searches through Jetpack Search's filtered results page instead of WooCommerce's default product search template.",
	'jetpack-search-pkg'
);

/**
 * Opt-in toggle for the `override_woocommerce_search_template` setting.
 *
 * @param {object}   props                 - Component properties.
 * @param {boolean}  props.isEnabled       - Whether the override is enabled.
 * @param {boolean}  props.isSaving        - Whether settings are being saved.
 * @param {Function} props.updateOptions   - Function to update settings.
 * @param {string}   props.editTemplateUrl - Site Editor URL for the product-search template.
 * @return {import('react').Component} WooCommerce product search settings component.
 */
export default function WooCommerceProductSearchControl( {
	isEnabled,
	isSaving,
	updateOptions,
	editTemplateUrl,
} ) {
	const toggle = useCallback( () => {
		const newOption = { override_woocommerce_search_template: ! isEnabled };
		updateOptions( newOption );
		analytics.tracks.recordEvent(
			'jetpack_search_woocommerce_search_template_override_toggle',
			newOption
		);
	}, [ isEnabled, updateOptions ] );

	return (
		<div className="jp-form-search-settings-group__toggle is-woocommerce-product-search jp-search-dashboard-wrap">
			<div className="jp-search-dashboard-row">
				<ToggleControl
					checked={ !! isEnabled }
					disabled={ isSaving }
					onChange={ toggle }
					className="jp-search-dashboard-toggle lg-col-span-12 md-col-span-8 sm-col-span-4"
					label={ __( 'Use Jetpack Search for product search results', 'jetpack-search-pkg' ) }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
			<div className="jp-search-dashboard-row">
				<div className="jp-form-search-settings-group__toggle-description lg-col-span-12 md-col-span-8 sm-col-span-4">
					<p className="jp-form-search-settings-group__toggle-explanation">
						{ WOOCOMMERCE_PRODUCT_SEARCH_DESCRIPTION }
					</p>
					{ isEnabled && editTemplateUrl && (
						<p className="jp-form-search-settings-group__toggle-explanation">
							<ExternalLink href={ editTemplateUrl }>
								{ __( 'Edit the product search template', 'jetpack-search-pkg' ) }
							</ExternalLink>
						</p>
					) }
				</div>
			</div>
		</div>
	);
}
