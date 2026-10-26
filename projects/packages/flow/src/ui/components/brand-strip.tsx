import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { ProductIcon } from './product-icon';
import type { Product } from '../types';

const BRANDS: Array< { product: Product; name: string } > = [
	{ product: 'woocommerce', name: 'WooCommerce' },
	{ product: 'mailpoet', name: 'MailPoet' },
	{ product: 'jetpack', name: 'Jetpack' },
	{ product: 'wordpress', name: 'WordPress' },
	{ product: 'akismet', name: 'Akismet' },
];

export function BrandStrip() {
	return (
		<Stack align="center" gap="lg" wrap="wrap" className="jetpack-flow-brands">
			<Text variant="body-sm">{ __( 'Connects', 'jetpack-flow-pkg' ) }</Text>
			{ BRANDS.map( ( { product, name } ) => (
				<Stack key={ product } align="center" gap="xs">
					<ProductIcon product={ product } size={ 24 } />
					<Text variant="body-sm">{ name }</Text>
				</Stack>
			) ) }
		</Stack>
	);
}
