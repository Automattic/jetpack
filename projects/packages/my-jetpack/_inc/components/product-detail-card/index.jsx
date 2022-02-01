/**
 * External dependencies
 */
import React from 'react';
import { useProduct } from '../../hooks/use-product';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * Product Interstitial component.
 *
 * @param {object} props          - Component props.
 * @param {string} props.slug     - Product slug
 * @returns {object}                ProductDetailCard react component.
 */
export default function ProductDetailCard( { slug } ) {
	const { detail } = useProduct( slug );
	const { title, longDescription } = detail;

	return (
		<div className={ styles.container }>
			<h3>{ title }</h3>
			<p>{ longDescription }</p>
		</div>
	);
}
