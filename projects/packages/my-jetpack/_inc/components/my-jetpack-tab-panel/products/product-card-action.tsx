import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
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
	switch ( product.slug ) {
		case 'anti-spam':
			return (
				<Button
					variant="secondary"
					// TODO replace with the correct URL
					href="#"
					size="small"
				>
					{ __( 'Learn more', 'jetpack-my-jetpack' ) }
				</Button>
			);

		case 'backup':
			return (
				<Button
					variant="secondary"
					href={ getRedirectUrl( 'my-jetpack-manage-backup' ) }
					size="small"
				>
					{ __( 'Learn more', 'jetpack-my-jetpack' ) }
				</Button>
			);

		default:
			return null;
	}
}
