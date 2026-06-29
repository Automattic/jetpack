import {
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Flex,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';
import { Badge } from '@wordpress/ui';
import { ProductCamelCase } from '../../../data/types';
import { MyJetpackModule } from '../../../types';
import { PRODUCT_ICONS } from './mappings';
import { ProductCardAction } from './product-card-action';
import styles from './styles.module.scss';
import { getProductStatus } from './utils';

export type ProductCardProps = {
	product: ProductCamelCase;
	module?: MyJetpackModule;
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
};

/**
 * Renders a product card
 *
 * @param {ProductCardProps} props - The component props.
 *
 * @return The rendered component.
 */
export function ProductCard( { product, headingLevel = 3, module: $module }: ProductCardProps ) {
	const Heading = `h${ headingLevel }` satisfies keyof JSX.IntrinsicElements;

	const Icon = PRODUCT_ICONS[ product.slug ];

	const { isAvailable, reason } = getProductStatus( product );

	return (
		<Card className={ styles[ 'product-card' ] }>
			<CardHeader>
				<Flex>
					<FlexBlock>
						<Flex justify="start" gap={ 4 }>
							{ Icon ? (
								<Flex className={ styles[ 'icon-wrapper' ] }>
									<Icon />
								</Flex>
							) : null }
							<Heading className={ styles[ 'card-title' ] }>{ product.name }</Heading>
						</Flex>
					</FlexBlock>
					{ isAvailable ? (
						<FlexItem>
							<ProductCardAction product={ product } module={ $module } />
						</FlexItem>
					) : null }
				</Flex>
			</CardHeader>
			<CardBody>
				<span className={ styles[ 'card-description' ] }>{ product.description }</span>
			</CardBody>
			{ ! isAvailable ? (
				<CardFooter>
					<Badge intent="medium">{ reason }</Badge>
				</CardFooter>
			) : null }
		</Card>
	);
}
