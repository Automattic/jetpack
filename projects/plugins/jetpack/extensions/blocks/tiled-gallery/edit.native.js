/**
 * External Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useState } from '@wordpress/element';
import { BlockControls, BlockIcon, MediaPlaceholder, MediaUpload } from '@wordpress/block-editor';
import { Button, ToolbarGroup, withNotices } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Layout from './layout';
import { ALLOWED_MEDIA_TYPES } from './constants';
import { icon } from '.';
import EditButton from '../../shared/edit-button';

export function defaultColumnsNumber( attributes ) {
	return Math.min( 3, attributes.images.length );
}

const TiledGalleryEdit = ( {
	attributes,
	isSelected,
	setAttributes,
	mergeBlocks,
	onRemove,
	style,
	className,
	noticeOperations,
	noticeUI,
	onFocus,
} ) => {
	const [ images, setImages ] = useState( [] );
	const [ columns, setColumns ] = useState( 0 );

	const { align, roundedCorners } = attributes;

	const onSelectImages = imgs => {
		setColumns( attributes.columns ? Math.min( imgs.length, attributes.columns ) : columns );
		setImages( imgs );
		debugger;
	};

	const controls = (
		<BlockControls>
			{ !! images.length && (
				<Fragment>
					<ToolbarGroup>
						{ () => (
							<MediaUpload
								onSelect={ () => alert( 'on select' ) }
								allowedTypes={ ALLOWED_MEDIA_TYPES }
								multiple
								gallery
								value={ images.map( img => img.id ) }
								render={ ( { open } ) => (
									<EditButton label={ __( 'Edit Gallery', 'jetpack' ) } onClick={ open } />
								) }
							/>
						) }
					</ToolbarGroup>
				</Fragment>
			) }
		</BlockControls>
	);

	if ( images.length === 0 ) {
		return (
			<Fragment>
				{ controls }
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					className={ className }
					labels={ {
						title: __( 'Tiled Gallery', 'jetpack' ),
						name: __( 'images', 'jetpack' ),
					} }
					onSelect={ onSelectImages }
					accept="image/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					multiple
					notices={ noticeUI }
					onFocus={ onFocus }
					onError={ '' }
				/>
			</Fragment>
		);
	} else {
		return (
			<Fragment>
				<Layout
					align={ align }
					className={ className }
					columns={ columns }
					images={ images }
					roundedCorners={ roundedCorners }
				/>
			</Fragment>
		);
	}
};

export default TiledGalleryEdit;
