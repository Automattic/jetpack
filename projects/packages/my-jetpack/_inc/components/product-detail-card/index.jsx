/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * Product Interstitial component.
 *
 * @param {object} props          - Component props.
 * @param {string} props.name     - Product name
 * @returns {object} ProductDetailCard react component.
 */
export default function ProductDetailCard( { name = '' } ) {
	return (
		<div className={ styles.container }>
			<h3>{ name }</h3>
		</div>
	);
}
