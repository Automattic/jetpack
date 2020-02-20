/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './videopress-plan-check.scss';
import UpgradeNudge from './components/upgrade-nudge';
import getJetpackExtensionAvailability from './get-jetpack-extension-availability';
//import isSimpleSite from './site-type-utils';

const replaceMediaPlaceholder = createHigherOrderComponent(
	OriginalPlaceholder => props => {
		const { available } = getJetpackExtensionAvailability( 'videopress' );

		if (
			//! isSimpleSite || // Only show nudge on dotcom simple sites.
			'wp-block-video' !== props.className || // Only show nudge on core video blocks.
			available // Don't show nudge when VideoPress is available.
		) {
			return <OriginalPlaceholder { ...props } />;
		}

		return (
			<>
				<UpgradeNudge
					plan="value_bundle"
					blockName="core/video"
					title={ _x(
						'to upload videos.',
						'Upgrade nudge title, preceeded by "Upgrade to [planname]"',
						'jetpack'
					) }
					subtitle={ __(
						'Upload unlimited videos to your website and \
						display them using a fast, unbranded, \
						customizable player.',
						'jetpack'
					) }
				/>
				<OriginalPlaceholder
					{ ...props }
					className="no-videopress-media-placeholder"
					labels={ {
						instructions: __(
							'Insert a video from a URL. To upload a video file please purchase a paid plan using the upgrade button above.',
							'jetpack'
						),
					} }
					disableDropZone={ true }
				/>
			</>
		);
	},
	'replaceMediaPlaceholder'
);

addFilter(
	'editor.MediaPlaceholder',
	'apeatling/replace-media-placeholder',
	replaceMediaPlaceholder
);
