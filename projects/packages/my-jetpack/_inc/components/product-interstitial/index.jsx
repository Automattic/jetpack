/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { Container, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { ProductDetail } from '../product-detail-card';
import styles from './style.module.scss';
import useAnalytics from '../../hooks/use-analytics';
import boostImage from './boost.png';
import searchImage from './search.png';

/**
 * Product Interstitial component.
 *
 * @param {object} props          - Component props.
 * @param {string} props.slug     - Product slug
 * @param {object} props.children - Product additional content
 * @returns {object}                ProductInterstitial react component.
 */
export default function ProductInterstitial( { slug, children = null } ) {
	const {
		tracks: { recordEvent },
	} = useAnalytics();

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_view', { product: slug } );
	}, [ recordEvent, slug ] );

	const trackProductClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', { product: slug } );
	}, [ recordEvent, slug ] );

	return (
		<Container className={ styles.container } horizontalSpacing={ 0 } horizontalGap={ 0 } fluid>
			<Col sm={ 4 } md={ 4 } lg={ 5 }>
				<ProductDetail slug={ slug } trackButtonClick={ trackProductClick } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 7 } className={ styles.imageContainer }>
				{ children }
			</Col>
		</Container>
	);
}

/**
 * AntiSpamInterstitial component
 *
 * @returns {object} AntiSpamInterstitial react component.
 */
export function AntiSpamInterstitial() {
	return (
		<ProductInterstitial slug="anti-spam">
			<h2>@todo Popular upgrade here</h2>
		</ProductInterstitial>
	);
}

/**
 * BackupInterstitial component
 *
 * @returns {object} BackupInterstitial react component.
 */
export function BackupInterstitial() {
	return (
		<ProductInterstitial slug="backup">
			<h2>@todo Popular upgrade here</h2>
		</ProductInterstitial>
	);
}

/**
 * BoostInterstitial component
 *
 * @returns {object} BoostInterstitial react component.
 */
export function BoostInterstitial() {
	return (
		<ProductInterstitial slug="boost">
			<img src={ boostImage } alt="Boost" />
		</ProductInterstitial>
	);
}

/**
 * ScanInterstitial component
 *
 * @returns {object} ScanInterstitial react component.
 */
export function ScanInterstitial() {
	return (
		<ProductInterstitial slug="scan">
			<h2>@todo Popular upgrade here</h2>
		</ProductInterstitial>
	);
}

/**
 * SearchInterstitial component
 *
 * @returns {object} SearchInterstitial react component.
 */
export function SearchInterstitial() {
	return (
		<ProductInterstitial slug="search">
			<img src={ searchImage } alt="Search" />
		</ProductInterstitial>
	);
}
