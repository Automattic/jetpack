/**
 * External dependencies
 */
import React from 'react';
import { Icon, check } from '@wordpress/icons';
import { getCurrencyObject } from '@automattic/format-currency';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { useProduct } from '../../hooks/use-product';
import { BackupIcon } from '../product-cards-section/backup-card';
import styles from './style.module.scss';

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
			return <BackupIcon />;
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
 * Product Interstitial component.
 *
 * @param {object} props          - Component props.
 * @param {string} props.slug     - Product slug
 * @returns {object}                ProductDetailCard react component.
 */
export default function ProductDetailCard( { slug } ) {
	const { detail } = useProduct( slug );
	const { title, longDescription, features } = detail;
	const price = 9;
	const currencyCode = 'USD';

	return (
		<div className={ styles.container }>
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
			<div className={ styles[ 'price-container' ] }>
				<Price value={ price } currency={ currencyCode } isOld={ true } />

				<Price value={ price } currency={ currencyCode } isOld={ false } />
			</div>
		</div>
	);
}

/**
 * BackupDetailCard component
 *
 * @returns {object} BackupDetailCard react component.
 */
export function BackupDetailCard() {
	return <ProductDetailCard slug="backup" />;
}
