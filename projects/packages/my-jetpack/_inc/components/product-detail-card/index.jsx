/**
 * External dependencies
 */
import React from 'react';
import { Icon, check } from '@wordpress/icons';

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
 * Product Interstitial component.
 *
 * @param {object} props          - Component props.
 * @param {string} props.slug     - Product slug
 * @returns {object}                ProductDetailCard react component.
 */
export default function ProductDetailCard( { slug } ) {
	const { detail } = useProduct( slug );
	const { title, longDescription, features } = detail;

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
