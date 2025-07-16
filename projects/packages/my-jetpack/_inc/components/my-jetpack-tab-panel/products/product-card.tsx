import { Badge } from '@automattic/ui';
import {
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Flex,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';
import { ProductCamelCase } from '../../../data/types';
import { ModuleStatus } from '../../module-status';
import { ModuleToggle } from '../../module-toggle';
import { MyJetpackModule } from '../../types';
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
						// Hide action buttons and status if not available.
						<FlexItem>
							{ $module?.available ? (
								<Flex gap={ 4 }>
									<ModuleStatus module={ $module } />
									<ModuleToggle module={ $module } />
								</Flex>
							) : (
								<ProductCardAction product={ product } />
							) }
						</FlexItem>
					) : null }
				</Flex>
			</CardHeader>
			<CardBody>
				<span className={ styles[ 'card-description' ] }>{ product.description }</span>
			</CardBody>
			{ ! isAvailable ? (
				<CardFooter>
					<Badge intent="warning">{ reason }</Badge>
				</CardFooter>
			) : null }
		</Card>
	);
}
