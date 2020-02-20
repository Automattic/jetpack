/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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
					subtitle={ __(
						'Upload unlimited videos to your website and \
						display them using a fast, unbranded, \
						customizable player.',
						'jetpack'
					) }
				/>
				<OriginalPlaceholder { ...props } />
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
