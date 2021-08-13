/**
 * External Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { Button, withNotices } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ALLOWED_MEDIA_TYPES } from './constants';
import { icon } from '.';

export function defaultColumnsNumber( attributes ) {
	return Math.min( 3, attributes.images.length );
}

const TiledGalleryEdit = ( {
	attributes,
	setAttributes,
	mergeBlocks,
	onRemove,
	style,
	className,
	noticeOperations,
	noticeUI,
	onFocus,
} ) => {
	const { textAlign, content } = attributes;

	return (
		<Fragment>
			<MediaPlaceholder
				icon={ <BlockIcon icon={ icon } /> }
				className={ className }
				labels={ {
					title: __( 'Tiled Gallery', 'jetpack' ),
					name: __( 'images', 'jetpack' ),
				} }
				onSelect={ () => {} }
				accept="image/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				multiple
				notices={ noticeUI }
				onFocus={ onFocus }
				onError={ '' }
			/>
		</Fragment>
	);
};

export default TiledGalleryEdit;
