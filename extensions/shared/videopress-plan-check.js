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

const replaceMediaPlaceholder = createHigherOrderComponent(
	OriginalPlaceholder => props => {
		if ( 'wp-block-video' !== props.className ) {
			return <OriginalPlaceholder { ...props } />;
		}

		return (
			<>
				<UpgradeNudge
					plan="premium-plan"
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
