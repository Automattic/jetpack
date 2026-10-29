/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoPressIcon } from '../video/components/icons';

/**
 * Episode Navigation block edit component: the links only exist on a video page.
 *
 * @return Edit component.
 */
export default function EpisodeNavigationEdit() {
	return (
		<div { ...useBlockProps() }>
			<Placeholder
				icon={ VideoPressIcon }
				label={ __( 'Episode Navigation', 'jetpack-videopress-pkg' ) }
				instructions={ __(
					'On a video page, links to the previous and next video, within the playlist being played or in upload order.',
					'jetpack-videopress-pkg'
				) }
			/>
		</div>
	);
}
