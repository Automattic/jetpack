/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import GalleryImageSave from '../gallery-image/save';
import Mosaic from './mosaic';
import Square from './square';
import { isSquareishLayout, photonizedImgProps } from '../utils';
import { LAYOUT_CIRCLE, MAX_ROUNDED_CORNERS } from '../constants';

export default class Layout extends Component {
	// This is tricky:
	// - We need to "photonize" to resize the images at appropriate dimensions
	// - The resize will depend on the image size and the layout in some cases
	// - Handlers need to be created by index so that the image changes can be applied correctly.
	//   This is because the images are stored in an array in the block attributes.
	renderImage( img, i ) {
		const { columns, imageFilter, images, linkTo, layoutStyle, selectedImage } = this.props;

		/* translators: %1$d is the order number of the image, %2$d is the total number of images. */
		const ariaLabel = sprintf(
			__( 'image %1$d of %2$d in gallery', 'jetpack' ),
			i + 1,
			images.length
		);

		const { src, srcSet } = photonizedImgProps( img, { layoutStyle } );

		return (
			<GalleryImageSave
				alt={ img.alt }
				aria-label={ ariaLabel }
				columns={ columns }
				height={ img.height }
				id={ img.id }
				imageFilter={ imageFilter }
				isFirstItem={ i === 0 }
				isLastItem={ i + 1 === images.length }
				isSelected={ selectedImage === i }
				key={ i }
				link={ img.link }
				linkTo={ linkTo }
				origUrl={ img.url }
				showMovers={ images.length > 1 }
				srcSet={ srcSet }
				url={ src }
				width={ img.width }
			/>
		);
	}

	render() {
		const { align, children, className, columns, images, layoutStyle, roundedCorners } = this.props;
		const LayoutRenderer = isSquareishLayout( layoutStyle ) ? Square : Mosaic;
		const renderedImages = this.props.images.map( this.renderImage, this );
		const roundedCornersValue =
			layoutStyle !== LAYOUT_CIRCLE ? Math.min( roundedCorners, MAX_ROUNDED_CORNERS ) : 0;

		return (
			<div
				className={ classnames( className, {
					[ `has-rounded-corners-${ roundedCornersValue }` ]: roundedCornersValue > 0,
				} ) }
			>
				<LayoutRenderer
					align={ align }
					columns={ columns }
					images={ images }
					layoutStyle={ layoutStyle }
					renderedImages={ renderedImages }
				/>
				{ children }
			</div>
		);
	}
}
