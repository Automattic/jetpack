/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import classnames from 'classnames';
import { Icon, check, plus } from '@wordpress/icons';
import { getCurrencyObject } from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';
import {
	AntiSpamIcon,
	BackupIcon,
	CheckmarkIcon,
	Col,
	getIconBySlug,
	Container,
	ScanIcon,
	StarIcon,
	Text,
} from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import getProductCheckoutUrl from '../../utils/get-product-checkout-url';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { useProduct } from '../../hooks/use-product';

import ProductDetailButton from '../product-detail-button';

/**
 * Simple react component to render the product icon,
 * depending on the product slug.
 *
 * @param {string} slug - The product slug.
 * @returns {object}    ProductDetailCard react component.
 */
function ProductIcon( { slug } ) {
	switch ( slug ) {
		case 'anti-spam':
			return <AntiSpamIcon size={ 24 } />;

		case 'backup':
			return <BackupIcon size={ 24 } />;

		case 'scan':
			return <ScanIcon size={ 24 } />;

		default:
			return null;
	}
}

/**
 * React component to render the price.
 *
 * @param {object} props          - Component props.
 * @param {string} props.value    - Product price
 * @param {string} props.currency - Product current code
 * @param {string} props.isOld    - True when the product price is old
 * @returns {object}                Price react component.
 */
function Price( { value, currency, isOld } ) {
	if ( ! value || ! currency ) {
		return null;
	}

	const priceObject = getCurrencyObject( value, currency );

	const classNames = classnames( styles.price, {
		[ styles[ 'is-old' ] ]: isOld,
	} );

	return (
		<Text className={ classNames } variant="headline-medium" component="p">
			<Text component="sup" variant="title-medium">
				{ priceObject.symbol }
			</Text>
			{ priceObject.integer }
			<Text component="sup" variant="title-medium">
				{ priceObject.fraction }
			</Text>
		</Text>
	);
}

/**
 * Product Detail component.
 *
 * @param {object} props                    - Component props.
 * @param {string} props.slug               - Product slug
 * @param {Function} props.onClick          - Callback for Call To Action button click
 * @param {Function} props.trackButtonClick - Function to call for tracking clicks on Call To Action button
 * @param {string} props.className					- A className to be concat with default ones
 * @returns {object}                          ProductDetailCard react component.
 */
const ProductDetailCard = ( { slug, onClick, trackButtonClick, className } ) => {
	const { detail, isFetching } = useProduct( slug );
	const {
		title,
		longDescription,
		features,
		pricingForUi,
		isBundle,
		supportedProducts,
		hasRequiredPlan,
	} = detail;

	const {
		isFree,
		fullPricePerMonth: price,
		currencyCode,
		discountPricePerMonth: discountPrice,
		wpcomProductSlug,
	} = pricingForUi;
	const { isUserConnected } = useMyJetpackConnection();

	/*
	 * Product needs purchase when:
	 * - it's not free
	 * - it does not have a required plan
	 */
	const needsPurchase = ! isFree && ! hasRequiredPlan;

	const addProductUrl =
		needsPurchase && wpcomProductSlug
			? getProductCheckoutUrl( wpcomProductSlug, isUserConnected ) // @ToDo: Remove this when we have a new product structure.
			: null;

	// Suppported products icons.
	const icons = isBundle
		? supportedProducts
				.join( '_plus_' )
				.split( '_' )
				.map( ( iconSlug, i ) => {
					if ( iconSlug === 'plus' ) {
						return (
							<Icon
								className={ styles[ 'plus-icon' ] }
								key={ `icon-plugs${ i }` }
								icon={ plus }
								size={ 14 }
							/>
						);
					}

					const SupportedProductIcon = getIconBySlug( iconSlug );
					return <SupportedProductIcon key={ iconSlug } size={ 24 } />;
				} )
		: null;

	const clickHandler = useCallback( () => {
		trackButtonClick();
		if ( onClick ) {
			onClick();
		}
	}, [ onClick, trackButtonClick ] );

	return (
		<Container
			className={ classnames( styles.card, className ) }
			fluid
			horizontalGap={ 0 }
			horizontalSpacing={ 0 }
		>
			{ isBundle && (
				<Col className={ styles[ 'card-header' ] }>
					<StarIcon className={ styles[ 'product-bundle-icon' ] } size={ 16 } />
					<Text variant="label">{ __( 'Popular upgrade', 'jetpack-my-jetpack' ) }</Text>
				</Col>
			) }

			<Col>
				<Container horizontalSpacing={ 5 } horizontalGap={ 2 } className={ styles.container }>
					<Col>
						{ isBundle && <div>{ icons }</div> }

						<ProductIcon slug={ slug } />
					</Col>

					<Text variant="headline-small" className={ styles.title } component={ Col }>
						{ title }
					</Text>

					<Text className={ styles.name } component={ Col }>
						{ longDescription }
					</Text>

					<Col>
						<ul className={ styles.features }>
							{ features.map( ( feature, id ) => (
								<Text component="li" key={ `feature-${ id }` } variant="body-extra-small">
									<Icon icon={ check } size={ 30 } />
									{ feature }
								</Text>
							) ) }
						</ul>
					</Col>

					{ needsPurchase && (
						<Col className={ styles[ 'price-container' ] }>
							<Price value={ price } currency={ currencyCode } isOld={ true } />
							<Price value={ discountPrice } currency={ currencyCode } isOld={ false } />
							<Text className={ styles[ 'price-description' ] }>
								{ __( '/month, paid yearly', 'jetpack-my-jetpack' ) }
							</Text>
						</Col>
					) }

					{ isFree && (
						<Text variant="title-small" component={ Col }>
							{ __( 'Free', 'jetpack-my-jetpack' ) }
						</Text>
					) }

					<Col>
						{ ( ! isBundle || ( isBundle && ! hasRequiredPlan ) ) && (
							<Text
								component={ ProductDetailButton }
								onClick={ clickHandler }
								isLoading={ isFetching }
								isPrimary={ ! isBundle }
								href={ onClick ? undefined : addProductUrl }
								className={ styles[ 'checkout-button' ] }
								variant="body"
							>
								{
									/* translators: placeholder is product name. */
									sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), title )
								}
							</Text>
						) }

						{ isBundle && hasRequiredPlan && (
							<div className={ styles[ 'product-has-required-plan' ] }>
								<CheckmarkIcon size={ 36 } />
								<Text>{ __( 'Active on your site', 'jetpack-my-jetpack' ) }</Text>
							</div>
						) }
					</Col>
				</Container>
			</Col>
		</Container>
	);
};

ProductDetailCard.defaultProps = {
	trackButtonClick: () => {},
};

export default ProductDetailCard;
