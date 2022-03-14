/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Button, Spinner } from '@wordpress/components';

const ProductDetailButton = ( { children, className, href, isLoading, onClick, isPrimary } ) => {
	return (
		<Button
			onClick={ onClick }
			className={ className }
			href={ href }
			variant={ isPrimary ? 'primary' : 'secondary' }
			disabled={ isLoading }
		>
			{ isLoading ? <Spinner /> : children }
		</Button>
	);
};

ProductDetailButton.propTypes = {
	className: PropTypes.string,
	isLoading: PropTypes.bool,
	isPrimary: PropTypes.bool,
};

ProductDetailButton.defaultProps = {
	isLoading: false,
	isPrimary: true,
};

export default ProductDetailButton;
