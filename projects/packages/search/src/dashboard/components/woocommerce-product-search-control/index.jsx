import analytics from '@automattic/jetpack-analytics';
import { ExternalLink, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import { useCallback } from 'react';
import SingletonTemplateActions from '../experience-selector/singleton-template-actions';
import './style.scss';

const WOOCOMMERCE_PRODUCT_SEARCH_DESCRIPTION = __(
	"Render product searches through Jetpack Search's filtered results page instead of WooCommerce's default product search template.",
	'jetpack-search-pkg'
);

/**
 * Opt-in toggle for the `override_woocommerce_search_template` setting.
 *
 * The edit affordance follows the active experience. Overlay (blocks) and
 * classic-theme Embedded/Inline route through a singleton CPT, so they get the
 * `SingletonTemplateActions` "Edit … →" + "Restore default" pair. Block-theme
 * Embedded/Inline edits its product-results page template in the Site Editor,
 * which owns its own revert — so that arm is a plain external link with no
 * restore. The parent decides which arm applies and passes `templateConfig`
 * (singleton) or `editTemplateUrl` (Site Editor) accordingly.
 *
 * @param {object}      props                       - Component properties.
 * @param {boolean}     props.isEnabled             - Whether the override is enabled.
 * @param {boolean}     props.isSaving              - Whether settings are being saved.
 * @param {Function}    props.updateOptions         - Function to update settings.
 * @param {object|null} props.templateConfig        - Singleton-template `{editorUrl, postType, isCustomized}` blob for the active mode, or null when the target is the Site Editor.
 * @param {string}      props.editTemplateUrl       - Site Editor URL — used only when `templateConfig` is null.
 * @param {string}      props.editLabel             - Visible label for the "Edit …" link.
 * @param {string}      props.restoreConfirmMessage - Confirm-dialog body for "Restore default".
 * @param {string}      props.successMessage        - Notice posted after a successful reset.
 * @param {string}      props.errorMessage          - Notice posted when a reset fails.
 * @return {import('react').Component} WooCommerce product search settings component.
 */
export default function WooCommerceProductSearchControl( {
	isEnabled,
	isSaving,
	updateOptions,
	templateConfig,
	editTemplateUrl,
	editLabel,
	restoreConfirmMessage,
	successMessage,
	errorMessage,
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
					label={
						<span className="jp-form-search-settings-group__toggle-label-with-badge">
							{ __( 'Use Jetpack Search for product search results', 'jetpack-search-pkg' ) }
							<Badge intent="informational">{ __( 'Beta', 'jetpack-search-pkg' ) }</Badge>
						</span>
					}
					__nextHasNoMarginBottom={ true }
				/>
			</div>
			<div className="jp-search-dashboard-row">
				<div className="jp-form-search-settings-group__toggle-description lg-col-span-12 md-col-span-8 sm-col-span-4">
					<p className="jp-form-search-settings-group__toggle-explanation">
						{ WOOCOMMERCE_PRODUCT_SEARCH_DESCRIPTION }
					</p>
					{ isEnabled && templateConfig && (
						<SingletonTemplateActions
							config={ templateConfig }
							editLabel={ editLabel }
							restoreConfirmMessage={ restoreConfirmMessage }
							successMessage={ successMessage }
							errorMessage={ errorMessage }
							linksDisabled={ isSaving }
						/>
					) }
					{ isEnabled && ! templateConfig && editTemplateUrl && (
						<p className="jp-form-search-settings-group__toggle-explanation">
							<ExternalLink href={ editTemplateUrl }>{ editLabel }</ExternalLink>
						</p>
					) }
				</div>
			</div>
		</div>
	);
}
