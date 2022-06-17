import { Button, Spinner } from '@wordpress/components';
import PropTypes from 'prop-types';
import React from 'react';

const ProductDetailButton = ( {
	children,
	className,
	href,
	isLoading,
	onClick,
	isPrimary,
	disabled,
} ) => {
	return (
		<Button
			onClick={ onClick }
			className={ className }
			href={ href }
			variant={ isPrimary ? 'primary' : 'secondary' }
			disabled={ isLoading || disabled }
		>
			{ isLoading ? <Spinner /> : children }
		</Button>
	);
};

ProductDetailButton.propTypes = {
	className: PropTypes.string,
	isLoading: PropTypes.bool,
	isPrimary: PropTypes.bool,
	disabled: PropTypes.bool,
};

ProductDetailButton.defaultProps = {
	isLoading: false,
	isPrimary: true,
	disabled: false,
};

export default ProductDetailButton;
