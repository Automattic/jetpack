/**
 * External dependencies
 */
import React from 'react';
import classnames from 'classnames';
import { Button } from '@wordpress/components';
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
import { BackupIcon, ScanIcon, StarIcon, getIconBySlug } from '../icons';

/**
 * Simple react component to render the product icon,
 * depending on the product slug.
 *
 * @param {string} slug - The product slug.
 * @returns {object}    ProductDetailCard react component.
 */
function ProductIcon( { slug } ) {
	switch ( slug ) {
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
 * @param {Function} props.trackButtonClick - Function to call for tracking clicks on Call To Action button
 * @returns {object}                          ProductDetailCard react component.
 */
const ProductDetail = ( { slug, trackButtonClick } ) => {
	const { detail } = useProduct( slug );
	const {
		title,
		longDescription,
		features,
		pricingForUi = {},
		isBundle,
		supportedProducts = [],
	} = detail;
	const { isFree, fullPrice, currencyCode, discountedPrice } = pricingForUi;
	const { isUserConnected } = useMyJetpackConnection();

	const addProductUrl = getProductCheckoutUrl( `jetpack_${ slug }`, isUserConnected ); // @ToDo: Remove this when we have a new product structure.

	// Suppported products icons.
	const icons = isBundle
		? supportedProducts
				.join( '_plus_' )
				.split( '_' )
				.map( iconSlug => {
					if ( iconSlug === 'plus' ) {
						return <Icon className={ styles[ 'plus-icon' ] } icon={ plus } size={ 14 } />;
					}

					const SupportedProductIcon = getIconBySlug( iconSlug );
					return <SupportedProductIcon key={ iconSlug } size={ 24 } />;
				} )
		: null;

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

				{ ! isFree && (
					<div className={ styles[ 'price-container' ] }>
						<Price value={ fullPrice } currency={ currencyCode } isOld={ true } />
						<Price value={ discountedPrice } currency={ currencyCode } isOld={ false } />
						<div className={ styles[ 'price-description' ] }>
							{ __( '/month, paid yearly', 'jetpack-my-jetpack' ) }
						</div>
					</div>
				) }

				{ isFree && (
					<h3 className={ styles[ 'product-free' ] }>{ __( 'Free', 'jetpack-my-jetpack' ) }</h3>
				) }

				<Button
					onClick={ trackButtonClick }
					isLink
					isPrimary={ ! isBundle }
					isSecondary={ isBundle }
					href={ addProductUrl }
					className={ `${ styles[ 'checkout-button' ] } ${
						isBundle ? styles[ 'is-bundle' ] : ''
					}` }
				>
					{
						/* translators: placeholder is product name. */
						sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), title )
					}
				</Button>
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
 * @param {object} props          - Component props.
 * @param {string} props.slug     - Product slug
 * @returns {object}                ProductDetailCard react component.
 */
export default function ProductDetailCard( { slug } ) {
	return (
		<div className={ styles.card }>
			<ProductDetail slug={ slug } />
		</div>
	);
}
