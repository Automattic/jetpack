/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	Card,
	CardBody,
	CardHeader,
	Flex,
	ToggleControl,
	__experimentalVStack as VStack,
	__experimentalView as View,
} from '@wordpress/components';
import { ProductSection as TProductSection } from './types';

export type ProductSectionProps = {
	section: TProductSection;
};

const noop = () => {};

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
		<section key={ section.id }>
			<h2>{ section.title }</h2>
			{ section.cards?.length ? (
				<Flex as="ul" wrap>
					{ section.cards.map( card => (
						<li key={ card.product.slug }>
							<Card>
								<CardHeader>
									<h3>{ card.product.name }</h3>
								</CardHeader>
								<CardBody>{ card.product.description }</CardBody>
							</Card>
						</li>
					) ) }
				</Flex>
			) : null }
			{ section.modules?.length ? (
				<VStack as="ul">
					{ section.modules.map( m => (
						<View as="li" key={ m.module }>
							<ToggleControl
								__nextHasNoMarginBottom
								checked={ m.activated }
								label={ m.name }
								onChange={ noop }
							/>
						</View>
					) ) }
				</VStack>
			) : null }
		</section>
	);
}
