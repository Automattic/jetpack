import { ExternalLink, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import { useCallback } from 'react';

const READER_CHAT_DESCRIPTION = __(
	'Let readers ask your blog questions and get answers from your content.',
	'jetpack-search-pkg'
);

/**
 * Reader Chat opt-in control. Reads and writes the reader_chat option
 * through the Search dashboard settings store.
 *
 * @param {object}   props               - Component properties.
 * @param {boolean}  props.isAvailable   - Whether Reader Chat can be shown for this site.
 * @param {boolean}  props.isEnabled     - Whether Reader Chat is enabled.
 * @param {boolean}  props.isSaving      - Whether settings are being saved.
 * @param {string}   props.guidelinesUrl - Guidelines admin URL, when available.
 * @param {Function} props.updateOptions - Function to update settings.
 * @return {import('react').Component} Reader Chat settings component.
 */
export default function ReaderChatControl( {
	isAvailable,
	isEnabled,
	isSaving,
	guidelinesUrl,
	updateOptions,
} ) {
	const toggle = useCallback(
		next => {
			updateOptions( { reader_chat: next } );
		},
		[ updateOptions ]
	);

	// Hide the control when this site should not expose Reader Chat settings.
	if ( ! isAvailable ) {
		return null;
	}

	return (
		<div className="jp-form-search-settings-group__toggle is-reader-chat jp-search-dashboard-wrap">
			<div className="jp-search-dashboard-row">
				<ToggleControl
					checked={ Boolean( isEnabled ) }
					disabled={ isSaving }
					onChange={ toggle }
					className="jp-search-dashboard-toggle lg-col-span-12 md-col-span-8 sm-col-span-4"
					label={
						<>
							{ __( 'Enable Reader Chat', 'jetpack-search-pkg' ) }
							<Badge intent="informational" className="jp-reader-chat-control__preview-badge">
								{ __( 'Preview', 'jetpack-search-pkg' ) }
							</Badge>
						</>
					}
					__nextHasNoMarginBottom
				/>
			</div>
			<div className="jp-search-dashboard-row">
				<div className="jp-form-search-settings-group__toggle-description lg-col-span-12 md-col-span-8 sm-col-span-4">
					<p className="jp-form-search-settings-group__toggle-explanation">
						{ READER_CHAT_DESCRIPTION }
					</p>
					{ isEnabled && guidelinesUrl && (
						<p className="jp-form-search-settings-group__toggle-explanation">
							<ExternalLink href={ guidelinesUrl }>
								{ __( 'Set guidelines', 'jetpack-search-pkg' ) }
							</ExternalLink>
						</p>
					) }
				</div>
			</div>
		</div>
	);
}
