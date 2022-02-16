/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import classnames from 'classnames';
import { Icon, check, plus } from '@wordpress/icons';
import { getCurrencyObject } from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import getProductCheckoutUrl from '../../utils/get-product-checkout-url';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { useProduct } from '../../hooks/use-product';
import {
	BackupIcon,
	ScanIcon,
	StarIcon,
	getIconBySlug,
	AntiSpamIcon,
	CheckmarkIcon,
} from '../icons';
import ProductDetailButton from './button';

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
		<div className={ classNames }>
			<sup className={ styles[ 'price-symbol' ] }>{ priceObject.symbol }</sup>
			<span className={ styles[ 'price-number' ] }>{ priceObject.integer }</span>
			<sup className={ styles[ 'price-fraction' ] }>{ priceObject.fraction }</sup>
		</div>
	);
}

/**
 * Product Detail component.
 *
 * @param {object} props                    - Component props.
 * @param {string} props.slug               - Product slug
 * @param {Function} props.onClick          - Callback for Call To Action button click
 * @param {Function} props.trackButtonClick - Function to call for tracking clicks on Call To Action button
 * @returns {object}                          ProductDetailCard react component.
 */
const ProductDetail = ( { slug, onClick, trackButtonClick } ) => {
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
		<>
			{ isBundle && (
				<div className={ styles[ 'card-header' ] }>
					<StarIcon className={ styles[ 'product-bundle-icon' ] } size={ 16 } />
					{ __( 'Popular upgrade', 'jetpack-my-jetpack' ) }
				</div>
			) }

			<div className={ styles.container }>
				{ isBundle && <div className={ styles[ 'product-icons' ] }>{ icons }</div> }

				<ProductIcon slug={ slug } />

				<h3>{ title }</h3>
				<p className={ styles.name }>{ longDescription }</p>
				<ul className={ styles.features }>
					{ features.map( ( feature, id ) => (
						<li key={ `feature-${ id }` }>
							<Icon icon={ check } size={ 30 } />
							{ feature }
						</li>
					) ) }
				</ul>

				{ needsPurchase && (
					<div className={ styles[ 'price-container' ] }>
						<Price value={ price } currency={ currencyCode } isOld={ true } />
						<Price value={ discountPrice } currency={ currencyCode } isOld={ false } />
						<div className={ styles[ 'price-description' ] }>
							{ __( '/month, paid yearly', 'jetpack-my-jetpack' ) }
						</div>
					</div>
				) }

				{ isFree && (
					<h3 className={ styles[ 'product-free' ] }>{ __( 'Free', 'jetpack-my-jetpack' ) }</h3>
				) }

				<div className={ styles[ 'cta-container' ] }>
					{ ( ! isBundle || ( isBundle && ! hasRequiredPlan ) ) && (
						<ProductDetailButton
							onClick={ clickHandler }
							isLoading={ isFetching }
							isPressed={ ! isBundle }
							isSecondary={ isBundle }
							href={ onClick ? undefined : addProductUrl }
							className={ `${ styles[ 'checkout-button' ] } ${
								isBundle ? styles[ 'is-bundle' ] : ''
							}` }
						>
							{
								/* translators: placeholder is product name. */
								sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), title )
							}
						</ProductDetailButton>
					) }

					{ isBundle && hasRequiredPlan && (
						<div className={ styles[ 'product-has-required-plan' ] }>
							<CheckmarkIcon size={ 36 } />
							{ __( 'Active on your site', 'jetpack-my-jetpack' ) }
						</div>
					) }
				</div>
			</div>
		</>
	);
};

ProductDetail.defaultProps = {
	trackButtonClick: () => {},
};

export { ProductDetail };

/**
 * ProductDetailCard component.
 *
 * @param {object}   props - Component props.
 * @returns {object}         ProductDetailCard react component.
 */
export default function ProductDetailCard( props ) {
	return (
		<div className={ styles.card }>
			<ProductDetail { ...props } />
		</div>
	);
}
