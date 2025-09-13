/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { Flex, __experimentalGrid as Grid } from '@wordpress/components';
import { ModulesList } from '../../modules-list';
import { ProductCard } from './product-card';
import styles from './styles.module.scss';
import { ProductSection as TProductSection } from './types';

export type ProductSectionProps = {
	section: TProductSection;
};

/**
 * Renders a section of products with cards and modules.
 *
 * @param {ProductSectionProps} props - The component props.
 *
 * @return The rendered component.
 */
export function ProductSection( { section }: ProductSectionProps ) {
	if ( ! section.cards?.length && ! section.modules?.length ) {
		return null;
	}

	return (
		<Flex
			as="section"
			direction="column"
			justify="start"
			gap={ 6 }
			expanded={ false }
			className={ styles[ 'product-section' ] }
		>
			<h2 className={ styles[ 'section-heading' ] }>{ section.title }</h2>
			{ section.cards?.length ? (
				<Grid as="ul" gap={ 6 } className={ styles[ 'product-cards' ] }>
					{ section.cards.map( card => (
						<li key={ card.product.slug }>
							<ProductCard product={ card.product } module={ card.module } />
						</li>
					) ) }
				</Grid>
			) : null }
			{ section.modules?.length ? <ModulesList modules={ section.modules } /> : null }
		</Flex>
	);
}
