import { ExternalLink, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import Card from 'components/card';

const READER_CHAT_DESCRIPTION = __(
	'Let readers ask your blog questions and get answers from your content.',
	'jetpack-search-pkg'
);
const READER_CHAT_GUIDELINES_URL = 'options-general.php?page=guidelines-wp-admin';

/**
 * Reader Chat opt-in control. Reads and writes the reader_chat option
 * through the Search dashboard settings store.
 *
 * Styled to match the "Enable Jetpack Search" toggle pattern in
 * module-control/index.jsx so both cards align on the dashboard.
 *
 * @param {object}   props               - Component properties.
 * @param {boolean}  props.isAvailable   - Whether the reader_chat setting is available.
 * @param {boolean}  props.isEnabled     - Whether Reader Chat is enabled.
 * @param {boolean}  props.isSaving      - Whether settings are being saved.
 * @param {Function} props.updateOptions - Function to update settings.
 * @return {import('react').Component} Reader Chat settings component.
 */
export default function ReaderChatControl( { isAvailable, isEnabled, isSaving, updateOptions } ) {
	const toggle = useCallback(
		next => {
			updateOptions( { reader_chat: next } );
		},
		[ updateOptions ]
	);

	// Hide the entire card when the setting is not registered on this
	// site (non-proxied / non-dev contexts during rollout).
	if ( ! isAvailable ) {
		return null;
	}

	return (
		<div className="jp-form-settings-group jp-form-search-settings-group">
			<Card className="jp-form-has-child">
				<div className="jp-form-search-settings-group-inside">
					<div className="jp-form-search-settings-group__toggle jp-search-dashboard-wrap">
						<div className="jp-search-dashboard-row">
							<ToggleControl
								checked={ Boolean( isEnabled ) }
								disabled={ isSaving }
								onChange={ toggle }
								className="jp-search-dashboard-toggle lg-col-span-12 md-col-span-8 sm-col-span-4"
								label={ __( 'Enable Reader Chat', 'jetpack-search-pkg' ) }
								__nextHasNoMarginBottom
							/>
						</div>
						<div className="jp-search-dashboard-row">
							<div className="jp-form-search-settings-group__toggle-description lg-col-span-7 md-col-span-5 sm-col-span-4">
								<p className="jp-form-search-settings-group__toggle-explanation">
									{ READER_CHAT_DESCRIPTION }
								</p>
								{ isEnabled && (
									<p className="jp-form-search-settings-group__toggle-explanation">
										<ExternalLink href={ READER_CHAT_GUIDELINES_URL }>
											{ __( 'Set guidelines', 'jetpack-search-pkg' ) }
										</ExternalLink>
									</p>
								) }
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
