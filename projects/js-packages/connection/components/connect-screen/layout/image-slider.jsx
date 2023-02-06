import PropTypes from 'prop-types';
import React from 'react';

/**
 * The ImageSlider component.
 *
 * @param {object} props -- The properties.
 * @param {Array} props.images -- Images to display on the right side.
 * @param {string} props.assetBaseUrl -- The assets base URL
 * @returns {React.Component} The `ImageSlider` component.
 */
const ImageSlider = props => {
	const { images, assetBaseUrl } = props;

	if ( ! images.length ) {
		return null;
	}

	const imagesHTML = images.map( ( image, index ) => (
		<React.Fragment key={ index }>
			<img src={ assetBaseUrl + image } alt="" />
		</React.Fragment>
	) );

	return <div className="jp-connection__connect-screen__image-slider">{ imagesHTML }</div>;
};

ImageSlider.propTypes = {
	images: PropTypes.arrayOf( PropTypes.string ).isRequired,
	assetBaseUrl: PropTypes.string,
};

ImageSlider.defaultProps = {
	assetBaseUrl: '',
};

export default ImageSlider;
