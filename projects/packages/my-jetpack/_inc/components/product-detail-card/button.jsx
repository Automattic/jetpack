/**
 * External dependencies
 */
import React from 'react';
import { Button } from '@wordpress/components';
import { Spinner } from '@automattic/jetpack-components';

const ProductDetailButton = ( {
	children,
	className,
	href,
	isLoading,
	onClick,
	isPrimary,
	isSecondary,
} ) => {
	return (
		<Button
			onClick={ onClick }
			className={ className }
			href={ href }
			isPrimary={ isPrimary }
			isSecondary={ isSecondary }
		>
			{ isLoading ? <Spinner /> : children }
		</Button>
	);
};

ProductDetailButton.defaultProps = {
	isLoading: false,
};

export default ProductDetailButton;
