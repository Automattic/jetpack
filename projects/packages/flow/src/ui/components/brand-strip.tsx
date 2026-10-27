import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { ProductIcon } from './product-icon';
import type { Product } from '../types';

type Brand = { product: Product; name: string };

const BRANDS: Brand[] = [
	{ product: 'woocommerce', name: 'WooCommerce' },
	{ product: 'mailpoet', name: 'MailPoet' },
	{ product: 'jetpack', name: 'Jetpack' },
	{ product: 'wordpress', name: 'WordPress' },
	{ product: 'akismet', name: 'Akismet' },
];

const AI_BRANDS: Brand[] = [
	{ product: 'claude', name: 'Claude' },
	{ product: 'google-ai', name: 'Google AI' },
	{ product: 'openai', name: 'OpenAI' },
];

const BrandRow = ( { brands }: { brands: Brand[] } ) => (
	<Stack align="center" justify="center" gap="lg" wrap="wrap">
		{ brands.map( ( { product, name } ) => (
			<Stack key={ product } align="center" gap="xs">
				<ProductIcon product={ product } size={ 24 } />
				<Text variant="body-sm">{ name }</Text>
			</Stack>
		) ) }
	</Stack>
);

/** Closing section of the page: the products Flow connects, centered. */
export function BrandStrip() {
	return (
		<Stack direction="column" align="center" gap="md" className="jetpack-flow-brands">
			<Text variant="body-sm">{ __( 'Connects', 'jetpack-flow-pkg' ) }</Text>
			<BrandRow brands={ BRANDS } />
			<Text variant="body-sm">{ __( 'Any AI tool', 'jetpack-flow-pkg' ) }</Text>
			<BrandRow brands={ AI_BRANDS } />
		</Stack>
	);
}
