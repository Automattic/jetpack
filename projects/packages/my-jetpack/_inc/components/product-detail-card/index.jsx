/**
 * External dependencies
 */
import React from 'react';
import classnames from 'classnames';
import { Button } from '@wordpress/components';
import { Icon, check } from '@wordpress/icons';
import { getCurrencyObject } from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useProduct } from '../../hooks/use-product';
import { BackupIcon } from '../product-cards-section/backup-card';
import styles from './style.module.scss';
import { BoostIcon } from '../product-cards-section/boost-card';

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

		case 'boost':
			return <BoostIcon />;
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
 * @param {object} props          - Component props.
 * @param {string} props.slug     - Product slug
 * @returns {object}                ProductDetailCard react component.
 */
export function ProductDetail( { slug } ) {
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
				<div className={ styles[ 'price-description' ] }>
					{ __( '/month, paid yearly', 'jetpack-my-jetpack' ) }
				</div>
			</div>

			<Button isLink isPrimary href="#" className={ styles[ 'checkout-button' ] }>
				{
					/* translators: placeholder is product name. */
					sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), title )
				}
			</Button>
		</div>
	);
}

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

/**
 * BackupDetailCard component
 *
 * @returns {object} BackupDetailCard react component.
 */
export function BackupDetailCard() {
	return <ProductDetailCard slug="backup" />;
}

/**
 * BackupDetail component
 *
 * @returns {object} BackupDetail react component.
 */
export function BackupDetail() {
	return <ProductDetail slug="backup" />;
}

/**
 * BoostDetailCard component
 *
 * @returns {object} BoostDetailCard react component.
 */
export function BoostDetailCard() {
	return <ProductDetailCard slug="boost" />;
}

/**
 * BoostDetail component
 *
 * @returns {object} BoostDetail react component.
 */
export function BoostDetail() {
	return <ProductDetail slug="boost" />;
}
