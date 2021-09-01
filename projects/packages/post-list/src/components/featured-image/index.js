/**
 * External dependencies
 */
import { Tooltip, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ImageIcon as icon } from '../icons';
import { createPortal } from '@wordpress/element';

export default function FeaturedImage( { url, thumb, alt, rootEl } ) {
	if ( ! url ) {
		return createPortal(
			<Tooltip
				text={ __( 'No featured image set.', 'jetpack' ) }
				position="top"
				className="jetpack-post-list__featured-image-tooltip"
			>
				<div className="post-list__post-featured-image">
					<Icon icon={ icon } size={ 48 } />
				</div>
			</Tooltip>,
			rootEl
		);
	}

	return createPortal(
		<img
			alt={ alt }
			className="post-list__post-featured-image"
			src={ thumb }
			width="50px"
			height="50px"
		/>,
		rootEl
	);
}
