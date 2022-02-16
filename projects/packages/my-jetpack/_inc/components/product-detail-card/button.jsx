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
	isLink,
	isLoading,
	onClick,
	isPrimary,
	isSecondary,
} ) => {
	return (
		<Button
			onClick={ onClick }
			isLink={ isLink }
			isPrimary={ isPrimary }
			isSecondary={ isSecondary }
			className={ className }
			href={ href }
		>
			{ isLoading ? <Spinner /> : children }
		</Button>
	);
};

ProductDetailButton.defaultProps = {
	isLink: true,
	isLoading: false,
	isPrimary: false,
	isSecondary: false,
};

export default ProductDetailButton;
