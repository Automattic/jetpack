import { __ } from '@wordpress/i18n';
import { ThreadsPostPreview } from './post-preview';
import { ThreadsPreviewProps } from './types';

export const ThreadsLinkPreview: React.FC< ThreadsPreviewProps > = props => {
	if ( ! props.image ) {
		return (
			<p className="social-preview__section-desc">
				{ __(
					'Threads link preview requires an image to be set for the post. Please add an image to see the preview.',
					'social-previews'
				) }
			</p>
		);
	}

	return (
		<ThreadsPostPreview
			{ ...props }
			// Override the props that are irrelevant to link preview
			caption=""
			media={ undefined }
		/>
	);
};
