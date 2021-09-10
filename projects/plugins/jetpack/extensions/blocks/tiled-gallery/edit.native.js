/**
 * External Dependencies
 */
import { View } from 'react-native';
import { concat, find } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	BlockControls,
	BlockIcon,
	InnerBlocks,
	MediaPlaceholder,
	MediaUpload,
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { Fragment, useState, useEffect, useMemo } from '@wordpress/element';
import { ToolbarGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Layout from './layout';
import { ALLOWED_MEDIA_TYPES } from './constants';
import { icon } from '.';
import EditButton from '../../shared/edit-button';
import styles from './styles.scss';
import TiledGallerySettings from './settings';

const TILE_SPACING = 8;

export function defaultColumnsNumber( attributes ) {
	return Math.min( 3, attributes.images.length );
}

const TiledGalleryEdit = props => {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const [ maxWidth, setMaxWidth ] = useState( 0 );

	const {
		setAttributes,
		attributes,
		className,
		clientId,
		noticeOperations,
		isSelected,
		noticeUI,
		onFocus,
	} = props;

	const { align, roundedCorners } = attributes;

	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	useEffect( () => {
		const { width } = sizes || {};
		if ( width ) {
			setMaxWidth( width );
		}
	}, [ sizes ] );

	const { getBlock } = useSelect(
		select => ( {
			getBlock: select( blockEditorStore ).getBlock,
		} ),
		[]
	);

	const innerBlockImages = useSelect(
		select => {
			return select( blockEditorStore ).getBlock( clientId )?.innerBlocks;
		},
		[ clientId ]
	);

	const images = useMemo( () =>
		innerBlockImages?.map( block => ( {
			clientId: block.clientId,
			id: block.attributes.id,
			url: block.attributes.url,
			attributes: block.attributes,
			fromSavedContent: Boolean( block.originalContent ),
		} ) )
	);

	const onSelectImages = imgs => {
		const newBlocks = imgs.map( image => {
			return createBlock( 'core/image', {
				id: image.id,
				url: image.url,
				caption: image.caption,
				alt: image.alt,
			} );
		} );

		replaceInnerBlocks( clientId, concat( innerBlockImages, newBlocks ) );
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

	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			contentResizeMode: 'stretch',
			allowedBlocks: [ 'core/image' ],
			orientation: 'horizontal',
			renderAppender: false,
			numColumns: 3,
			marginHorizontal: TILE_SPACING,
			marginVertical: TILE_SPACING,
			__experimentalLayout: { type: 'default', alignments: [] },
			gridProperties: {
				numColumns: 3,
			},
			parentWidth: maxWidth + 2 * TILE_SPACING,
		}
	);

	const mediaPlaceholder = (
		<MediaPlaceholder
			isAppender={ images.length > 0 }
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
	);

	const blockProps = useBlockProps( {
		className: className,
	} );

	return (
		<View blockProps={ blockProps }>
			{ resizeObserver }
			<TiledGallerySettings />
			<View { ...innerBlocksProps } />
			<View style={ [ styles.galleryAppender ] }>{ mediaPlaceholder }</View>
		</View>
	);
};

export default TiledGalleryEdit;
