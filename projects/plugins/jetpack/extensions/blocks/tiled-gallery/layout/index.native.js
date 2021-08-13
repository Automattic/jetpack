/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import GalleryImageEdit from '../gallery-image/edit';
import GalleryImageSave from '../gallery-image/save';
import Mosaic from './mosaic';
import Square from './square';
import { isSquareishLayout, photonizedImgProps } from '../utils';
import { LAYOUT_CIRCLE, MAX_ROUNDED_CORNERS } from '../constants';

import { Image } from '@wordpress/components';

const renderImage = ( img, i, images ) => {
	const ariaLabel = sprintf(
		/* translators: %1$d is the order number of the image, %2$d is the total number of images. */
		__( 'image %1$d of %2$d in gallery', 'jetpack' ),
		i + 1,
		images.length
	);
	// const Image = isSave ? GalleryImageSave : GalleryImageEdit;

	// const { src, srcSet } = photonizedImgProps( img, {} );
	const src = img.url;

	return <Image url={ src } width={ img.width } />;
};

const Layout = props => {
	const {
		align,
		children,
		className,
		columns,
		images,
		layoutStyle,
		roundedCorners,
		onResize,
		isSave,
		columnWidths,
	} = props;
	const LayoutRenderer = isSquareishLayout( layoutStyle ) ? Square : Mosaic;
	const renderedImages = images.map( renderImage );
	const roundedCornersValue =
		layoutStyle !== LAYOUT_CIRCLE ? Math.min( roundedCorners, MAX_ROUNDED_CORNERS ) : 0;

	return (
		<>
			<LayoutRenderer
				align={ align }
				columns={ columns }
				columnWidths={ isSave ? columnWidths : undefined }
				images={ images }
				layoutStyle={ layoutStyle }
				renderedImages={ renderedImages }
				onResize={ isSave ? undefined : onResize }
			/>
			{ children }
		</>
	);
};

export default Layout;
