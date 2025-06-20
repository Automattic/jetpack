import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ProductCamelCase } from '../../../data/types';

export type ProductCardActionProps = {
	product: ProductCamelCase;
};

/**
 * Renders the action for a product card
 *
 * @param {ProductCardActionProps} props - Component props
 *
 * @return The rendered component
 */
export function ProductCardAction( { product }: ProductCardActionProps ) {
	const navigate = useNavigate();

	const onClick = useCallback( () => {
		navigate( `/add-${ product.slug }` );
	}, [ navigate, product.slug ] );

	return (
		<Button variant="secondary" size="compact" onClick={ onClick }>
			{ __( 'Learn more', 'jetpack-my-jetpack' ) }
		</Button>
	);
}
