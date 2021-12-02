/**
 * External Dependencies
 */
import { useWindowDimensions, View } from 'react-native';
import { concat } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	LinkSettingsNavigation,
	PanelBody,
	RangeControl,
	UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { usePreferredColorSchemeStyle, useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ALLOWED_MEDIA_TYPES, LAYOUT_CIRCLE, LAYOUT_STYLES } from './constants';
import { getActiveStyleName } from '../../shared/block-styles';
import LayoutPicker from './layout-picker.native';
import { icon } from '.';
import styles from './styles.scss';

const TILE_SPACING = 8;
const DEFAULT_COLUMNS_PORTRAIT = 2;
const DEFAULT_COLUMNS_LANDSCAPE = 4;
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 8;
const MIN_ROUNDED_CORNERS = 0;
const MAX_ROUNDED_CORNERS = 20;
const DEFAULT_ROUNDED_CORNERS = 2;

export function defaultColumnsNumber( images ) {
	return Math.min( MAX_COLUMNS, images.length );
}

function defaultColumnsSetting( window ) {
	return window.width >= window.height ? DEFAULT_COLUMNS_LANDSCAPE : DEFAULT_COLUMNS_PORTRAIT;
}

function shownColumns( window, numImages ) {
	return Math.min( numImages, defaultColumnsSetting( window ) );
}

const TiledGallerySettings = props => {
	const horizontalSettingsDivider = usePreferredColorSchemeStyle(
		styles.horizontalBorder,
		styles.horizontalBorderDark
	);

	const { setAttributes, numImages, linkTo, columns, roundedCorners, clientId, className } = props;

	const [ columnNumber, setColumnNumber ] = useState( columns );

	const [ roundedCornerRadius, setRoundedCornerRadius ] = useState(
		roundedCorners ?? DEFAULT_ROUNDED_CORNERS
	);
	const [ linkToURL, setLinkToURL ] = useState( linkTo ?? '' );

	const linkSettingsOptions = {
		url: {
			label: __( 'Link URL', 'jetpack' ),
			placeholder: __( 'Add URL', 'jetpack' ),
			autoFocus: true,
			autoFill: true,
		},
	};

	const layoutStyle = getActiveStyleName( LAYOUT_STYLES, className );

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Tiled gallery settings', 'jetpack' ) } />

			<PanelBody>
				<LayoutPicker clientId={ clientId } className={ className } />
			</PanelBody>
			<PanelBody>
				<UnitControl
					label={ __( 'Columns', 'jetpack' ) }
					min={ MIN_COLUMNS }
					max={ numImages }
					value={ Math.min( columnNumber, numImages ) }
					onChange={ value => {
						setColumnNumber( value );
						setAttributes( { columns: value } );
					} }
				/>
			</PanelBody>
			{ layoutStyle !== LAYOUT_CIRCLE && (
				<PanelBody style={ horizontalSettingsDivider }>
					<RangeControl
						label={ __( 'Rounded corners', 'jetpack' ) }
						minimumValue={ MIN_ROUNDED_CORNERS }
						maximumValue={ MAX_ROUNDED_CORNERS }
						value={ roundedCornerRadius }
						onChange={ value => {
							setRoundedCornerRadius( value );
							setAttributes( { roundedCorners: value } );
						} }
					/>
				</PanelBody>
			) }
			<PanelBody>
				<LinkSettingsNavigation
					url={ linkToURL }
					setAttributes={ value => {
						setLinkToURL( value.url );
					} }
					withBottomSheet={ false }
					hasPicker
					options={ linkSettingsOptions }
					showIcon={ false }
				/>
			</PanelBody>
		</InspectorControls>
	);
};

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
		attributes: { columns: columnsSetting, images: attributeImages, linkTo, roundedCorners },
	} = props;

	const { replaceInnerBlocks, updateBlockAttributes } = useDispatch( blockEditorStore );

	useEffect( () => {
		const { width } = sizes || {};
		if ( width ) {
			setMaxWidth( width );
		}

		console.log( '****** COUNT : %d', columnsSetting );
	}, [ sizes ] );

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
		console.log( '****** COUNT : %d', columnsSetting );

		images?.forEach( newImage => {
			updateBlockAttributes( newImage.clientId, {
				...newImage.attributes,
				id: newImage.id,
			} );
		} );

		const newIds = images?.map( image => image.id );
		setAttributes( { ids: newIds } );
	}, [ images, setAttributes, updateBlockAttributes ] );

	const populateInnerBlocksWithImages = ( imgs, replace = false ) => {
		console.log( '***', Math.min( columnsSetting, shownColumns( window, images.length ) ) );

		const newBlocks = imgs.map( image => {
			return createBlock( 'core/image', {
				id: image.id,
				url: image.url,
				caption: image.caption,
				alt: image.alt,
				className: styles[ 'is-style-squared' ],
			} );
		} );

		replaceInnerBlocks( clientId, replace ? newBlocks : concat( innerBlockImages, newBlocks ) );
	};

	if ( attributeImages.length && ! images.length ) {
		populateInnerBlocksWithImages( attributeImages, true );
	}
	// Math.min( columnsSetting, shownColumns( window, images.length ) )
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			contentResizeMode: 'stretch',
			allowedBlocks: [ 'core/image' ],
			orientation: 'horizontal',
			renderAppender: false,
			numColumns: shownColumns( window, images.length ),
			marginHorizontal: TILE_SPACING,
			marginVertical: TILE_SPACING,
			__experimentalLayout: { type: 'default', alignments: [] },
			gridProperties: {
				numColumns: shownColumns( window, images.length ),
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
				setAttributes={ setAttributes }
				linkTo={ linkTo }
				columns={ columnsSetting }
				roundedCorners={ roundedCorners }
				clientId={ clientId }
				className={ props.attributes.className }
				numImages={ images.length }
			/>
			<View { ...innerBlocksProps } />
			<View style={ [ styles.galleryAppender ] }>{ mediaPlaceholder }</View>
		</View>
	);
};

export default TiledGalleryEdit;
