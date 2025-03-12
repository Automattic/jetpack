import { __, sprintf } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import clsx from 'clsx';
import Alert from '../alert/index.js';
import Button from '../button/index.js';
import { CheckmarkIcon } from '../icons/index.js';
import ProductPrice from '../product-price/index.js';
import Text, { H3, Title } from '../text/index.js';
import { IconsCard } from './icons-card.js';
import { ProductOfferHeader } from './product-offer-header.js';
import styles from './style.module.scss';
import { ProductOfferProps } from './types.js';
import type React from 'react';

/**
 * Product Detail component.
 *
 * @param {ProductOfferProps} props - Component props.
 * @return {React.ReactNode} - ProductOffer react component.
 */
const ProductOffer: React.FC< ProductOfferProps > = ( {
	addProductUrl,
	buttonDisclaimer,
	buttonText = '',
	className,
	description,
	error = '',
	features,
	hasRequiredPlan,
	icon,
	isBundle = false,
	isCard,
	isLoading,
	onAdd,
	pricing = {},
	slug,
	subTitle = '',
	supportedProducts,
	title = '',
} ) => {
	const { isFree, price, currency, offPrice } = pricing;
	const needsPurchase = ! isFree && ! hasRequiredPlan;

	const defautlButtonText = sprintf(
		/* translators: placeholder is product name. */
		__( 'Add %s', 'jetpack-components' ),
		title
	);

	return (
		<div
			className={ clsx( styles.wrapper, className, {
				[ styles[ 'is-bundle-card' ] ]: isBundle,
				[ styles[ 'is-card' ] ]: isCard || isBundle, // is card when is bundle.
			} ) }
		>
			{ isBundle && <ProductOfferHeader /> }

			<div className={ styles[ 'card-container' ] }>
				<IconsCard
					icon={ icon }
					products={ supportedProducts?.length ? supportedProducts : [ slug ] }
					size={ 32 }
				/>
				<H3>{ title }</H3>
				{ subTitle && <Title mb={ 3 }>{ subTitle }</Title> }
				{ description && <Text mb={ 3 }>{ description }</Text> }

				<ul className={ styles.features }>
					{ features.map( ( feature, id ) => (
						<Text component="li" key={ `feature-${ id }` } variant="body">
							<Icon icon={ check } size={ 24 } className={ styles.check } />
							{ feature }
						</Text>
					) ) }
				</ul>

				{ needsPurchase && (
					<ProductPrice price={ price } offPrice={ offPrice } currency={ currency } />
				) }

				{ isFree && <H3>{ __( 'Free', 'jetpack-components' ) }</H3> }

				<Alert level="error" showIcon={ !! error }>
					{ error }
				</Alert>

				{ buttonDisclaimer }

				{ ( ! isBundle || ( isBundle && ! hasRequiredPlan ) ) && (
					<Button
						onClick={ addProductUrl ? null : onAdd }
						isLoading={ isLoading }
						disabled={ isLoading }
						variant={ isLoading || ! isBundle ? 'primary' : 'secondary' }
						className={ styles[ 'add-button' ] }
						{ ...( addProductUrl ? { href: addProductUrl } : {} ) }
					>
						{ buttonText || defautlButtonText }
					</Button>
				) }

				{ isBundle && hasRequiredPlan && (
					<div className={ styles[ 'product-has-required-plan' ] }>
						<CheckmarkIcon size={ 36 } />
						<Text>{ __( 'Active on your site', 'jetpack-components' ) }</Text>
					</div>
				) }
			</div>
		</div>
	);
};

export default ProductOffer;
export * from './icons-card.js';
