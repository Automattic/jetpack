import {
	store as blockEditorStore,
	MediaPlaceholder,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useResizeObserver } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { concat } from 'lodash';
import { useWindowDimensions, View } from 'react-native';
import { getActiveStyleName } from '../../shared/block-styles';
import { ALLOWED_MEDIA_TYPES, LAYOUT_STYLES, MAX_COLUMNS } from './constants';
import TiledGallerySettings, { DEFAULT_COLUMNS } from './settings';
import styles from './styles.scss';
import { icon } from '.';

const TILE_SPACING = 8;
const MAX_DISPLAYED_COLUMNS_PORTRAIT = 2;
const MAX_DISPLAYED_COLUMNS_LANDSCAPE = 4;

export function defaultColumnsNumber( images ) {
	return Math.min( MAX_COLUMNS, images.length );
}

const maxDisplayedColumnsNumber = window =>
	window.width >= window.height ? MAX_DISPLAYED_COLUMNS_LANDSCAPE : MAX_DISPLAYED_COLUMNS_PORTRAIT;

const TiledGalleryEdit = props => {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const [ maxWidth, setMaxWidth ] = useState( 0 );

	const window = useWindowDimensions();

	const {
		className,
		clientId,
		noticeUI,
		onFocus,
		setAttributes,
		attributes: { columns, images: attributeImages, roundedCorners },
	} = props;

	const { replaceInnerBlocks, updateBlockAttributes } = useDispatch( blockEditorStore );

	const displayedColumns = Math.min( columns, maxDisplayedColumnsNumber( window ) );

	useEffect( () => {
		const { width } = sizes || {};
		if ( width ) {
			setMaxWidth( width );

			if ( columns ) {
				const columnWidths = new Array( columns ).fill( Math.floor( width / columns ) );
				setAttributes( { columnWidths: [ columnWidths ] } );
			}
		}
	}, [ sizes, columns, setAttributes ] );

	const innerBlockImages = useSelect(
		select => {
			return select( blockEditorStore ).getBlock( clientId )?.innerBlocks;
		},
		[ clientId ]
	);

	const images = useMemo(
		() =>
			innerBlockImages?.map( block => ( {
				clientId: block.clientId,
				id: block.attributes.id,
				url: block.attributes.url,
				attributes: block.attributes,
				fromSavedContent: Boolean( block.originalContent ),
			} ) ),
		[ innerBlockImages ]
	);

	useEffect( () => {
		images?.forEach( newImage => {
			updateBlockAttributes( newImage.clientId, {
				...newImage.attributes,
				id: newImage.id,
			} );
		} );

		const newIds = images?.map( image => image.id );
		setAttributes( { ids: newIds } );
	}, [ images, setAttributes, updateBlockAttributes ] );

	useEffect( () => {
		if ( ! columns ) {
			const col = Math.min( images.length, DEFAULT_COLUMNS );
			setAttributes( { columns: Math.max( col, 1 ) } );
		}
	}, [ columns, images, setAttributes ] );

	const populateInnerBlocksWithImages = ( imgs, replace = false ) => {
		const layoutStyle = getActiveStyleName( LAYOUT_STYLES, className );

		const newBlocks = imgs.map( image => {
			return createBlock( 'core/image', {
				id: image.id,
				url: image.url,
				caption: image.caption,
				alt: image.alt,
				className: styles[ `is-style-${ layoutStyle }` ],
			} );
		} );

		replaceInnerBlocks( clientId, replace ? newBlocks : concat( innerBlockImages, newBlocks ) );
	};

	useEffect( () => {
		if ( ! columns ) {
			setAttributes( { columns: DEFAULT_COLUMNS } );
		}
	}, [ columns, setAttributes ] );

	if ( attributeImages.length && ! images.length ) {
		populateInnerBlocksWithImages( attributeImages, true );
	}

	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			contentResizeMode: 'stretch',
			allowedBlocks: [ 'core/image' ],
			orientation: 'horizontal',
			renderAppender: false,
			numColumns: displayedColumns,
			marginHorizontal: TILE_SPACING,
			marginVertical: TILE_SPACING,
			__experimentalLayout: { type: 'default', alignments: [] },
			gridProperties: {
				numColumns: displayedColumns,
			},
			parentWidth: maxWidth + 2 * TILE_SPACING,
		}
	);

	const mediaPlaceholder = (
		<MediaPlaceholder
			isAppender={ images.length > 0 }
			icon={ icon }
			className={ className }
			labels={ {
				title: __( 'Tiled Gallery', 'jetpack' ),
				name: __( 'images', 'jetpack' ),
				instructions: __( 'ADD MEDIA', 'jetpack' ),
			} }
			onSelect={ populateInnerBlocksWithImages }
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
			<TiledGallerySettings
				setAttributes={ props.setAttributes }
				columns={ columns }
				roundedCorners={ roundedCorners }
				clientId={ clientId }
				className={ props.attributes.className }
				window={ window }
				numImages={ images.length }
			/>
			<View { ...innerBlocksProps } />
			<View style={ [ styles.galleryAppender ] }>{ mediaPlaceholder }</View>
		</View>
	);
};

export default TiledGalleryEdit;
