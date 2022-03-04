/**
 * External dependencies
 */
import React from 'react';
import { Button } from '@wordpress/components';
import { Spinner } from '@automattic/jetpack-components';

const ProductDetailButton = ( { children, className, href, isLoading, onClick, isPrimary } ) => {
	return (
		<Button
			onClick={ onClick }
			className={ className }
			href={ href }
			variant={ isPrimary ? 'primary' : 'secondary' }
		>
			{ isLoading ? <Spinner /> : children }
		</Button>
	);
};

ProductDetailButton.defaultProps = {
	isLoading: false,
};

export default ProductDetailButton;
