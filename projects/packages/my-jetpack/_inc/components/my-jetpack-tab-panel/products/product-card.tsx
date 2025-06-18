import {
	Card,
	CardBody,
	CardHeader,
	Flex,
	FlexBlock,
	FlexItem,
	FormToggle,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { ProductCamelCase } from '../../../data/types';
import { ModuleStatus } from '../../module-status';
import { MyJetpackModule } from '../../types';
import { PRODUCT_ICONS } from './mappings';
import { ProductCardAction } from './product-card-action';
import styles from './styles.module.scss';

export type ProductCardProps = {
	product: ProductCamelCase;
	module?: MyJetpackModule;
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;

	onToggle?: ( module: MyJetpackModule ) => void;
};

/**
 * Renders a product card
 *
 * @param {ProductCardProps} props - The component props.
 *
 * @return The rendered component.
 */
export function ProductCard( {
	product,
	headingLevel = 3,
	module: $module,
	onToggle,
}: ProductCardProps ) {
	const Heading = `h${ headingLevel }` satisfies keyof JSX.IntrinsicElements;

	const Icon = PRODUCT_ICONS[ product.slug ];

	const onChange = useCallback( () => {
		onToggle?.( $module );
	}, [ onToggle, $module ] );

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
					<FlexItem>
						{ $module ? (
							<Flex>
								<ModuleStatus module={ $module } />
								<FormToggle
									checked={ $module.activated }
									onChange={ onChange }
									aria-label={ sprintf(
										/* translators: %s is the module name */
										__( 'Toggle %s module', 'jetpack-my-jetpack' ),
										$module.name
									) }
								/>
							</Flex>
						) : (
							<ProductCardAction product={ product } />
						) }
					</FlexItem>
				</Flex>
			</CardHeader>
			<CardBody>
				<span className={ styles[ 'card-description' ] }>{ product.description }</span>
			</CardBody>
		</Card>
	);
}
