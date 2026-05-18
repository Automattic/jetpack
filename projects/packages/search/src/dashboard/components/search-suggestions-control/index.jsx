import analytics from '@automattic/jetpack-analytics';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';

const SEARCH_SUGGESTIONS_DESCRIPTION = __(
	'Show autocomplete suggestions as visitors type.',
	'jetpack-search-pkg'
);

/**
 * Search suggestions opt-in control. Reads and writes the
 * search_suggestions_enabled option through the Search dashboard settings
 * store. Applies to active Jetpack Search experiences.
 *
 * @param {object}   props                         - Component properties.
 * @param {boolean}  props.isEnabled               - Whether search suggestions are enabled.
 * @param {boolean}  props.isSearchEnabled         - Whether Jetpack Search is enabled.
 * @param {boolean}  props.supportsSearch          - Whether the plan supports Jetpack Search.
 * @param {boolean}  props.isSaving                - Whether settings are being saved.
 * @param {boolean}  props.isDisabledFromOverLimit - Whether controls are locked due to over-limit usage.
 * @param {Function} props.updateOptions           - Function to update settings.
 * @return {import('react').Component} Search suggestions settings component.
 */
export default function SearchSuggestionsControl( {
	isEnabled,
	isSearchEnabled,
	supportsSearch,
	isSaving,
	isDisabledFromOverLimit,
	updateOptions,
} ) {
	const toggle = useCallback( () => {
		if ( isDisabledFromOverLimit ) {
			return;
		}
		const newOption = { search_suggestions_enabled: ! isEnabled };
		updateOptions( newOption );
		analytics.tracks.recordEvent( 'jetpack_search_suggestions_toggle', newOption );
	}, [ isEnabled, updateOptions, isDisabledFromOverLimit ] );

	if ( ! supportsSearch || ! isSearchEnabled ) {
		return null;
	}

	const isToggleDisabled = isSaving || isDisabledFromOverLimit;

	return (
		<div className="jp-form-search-settings-group__toggle is-search-suggestions jp-search-dashboard-wrap">
			<div className="jp-search-dashboard-row">
				<ToggleControl
					checked={ !! isEnabled && ! isDisabledFromOverLimit }
					disabled={ isToggleDisabled }
					onChange={ toggle }
					className="jp-search-dashboard-toggle lg-col-span-12 md-col-span-8 sm-col-span-4"
					label={ __( 'Enable search suggestions', 'jetpack-search-pkg' ) }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
			<div className="jp-search-dashboard-row">
				<div className="jp-form-search-settings-group__toggle-description lg-col-span-12 md-col-span-8 sm-col-span-4">
					<p className="jp-form-search-settings-group__toggle-explanation">
						{ SEARCH_SUGGESTIONS_DESCRIPTION }
					</p>
				</div>
			</div>
		</div>
	);
}
