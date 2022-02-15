/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React, { useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Container, Col, JetpackFooter } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import MyJetpackScreen from './components/my-jetpack-screen';
import ConnectionScreen from './components/connection-screen';
import { initStore } from './state/store';
import {
	AntiSpamInterstitial,
	BackupInterstitial,
	BoostInterstitial,
	CRMInterstitial,
	ScanInterstitial,
	SearchInterstitial,
	VideoPressInterstitial,
} from './components/product-interstitial';
import GoBackLink from './components/go-back-link';
import styles from './style.module.scss';
import useAnalytics from './hooks/use-analytics';

initStore();

/**
 * Main layout component.
 * Takes it as an initil basic approach that
 * could get more complex in the future.
 *
 * @param {object} props          - Component props.
 * @param {boolean} props.nav     - Header navigation.
 * @param {object} props.children - Child components.
 * @param {string} props.slug     - A product slug or undefined. Will Fire Tracks event with product:slug if not undefined
 * @returns {object}                Layout react component.
 */
function Layout( { nav = false, children, slug } ) {
	const {
		tracks: { recordEvent },
	} = useAnalytics();
	const onClick = useCallback( () => {
		if ( slug ) {
			recordEvent( 'jetpack_myjetpack_product_interstitial_back_link_click', { product: slug } );
		}
	}, [ recordEvent, slug ] );

	if ( ! nav ) {
		return children;
	}

	return (
		<div className={ styles.layout }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col>
					<GoBackLink onClick={ onClick } />
				</Col>
				<Col>{ children }</Col>
			</Container>
			<Container horizontalSpacing={ 5 }>
				<Col>
					<JetpackFooter />
				</Col>
			</Container>
		</div>
	);
}

const MyJetpack = () => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <MyJetpackScreen /> } />
			<Route
				path="/connection"
				element={ <Layout nav={ true } children={ <ConnectionScreen /> } /> }
			/>
			<Route
				path="/add-anti-spam"
				element={ <Layout nav={ true } children={ <AntiSpamInterstitial /> } slug="anti-spam" /> }
			/>
			<Route
				path="/add-backup"
				element={ <Layout nav={ true } children={ <BackupInterstitial /> } slug="backup" /> }
			/>
			<Route
				path="/add-boost"
				element={ <Layout nav={ true } children={ <BoostInterstitial /> } slug="boost" /> }
			/>
			<Route
				path="/add-crm"
				element={ <Layout nav={ true } children={ <CRMInterstitial /> } slug="crm" /> }
			/>
			<Route
				path="/add-scan"
				element={ <Layout nav={ true } children={ <ScanInterstitial /> } slug="scan" /> }
			/>
			<Route
				path="/add-search"
				element={ <Layout nav={ true } children={ <SearchInterstitial /> } slug="search" /> }
			/>
			<Route
				path="/add-videopress"
				element={
					<Layout nav={ true } children={ <VideoPressInterstitial /> } slug="videopress" />
				}
			/>
		</Routes>
	</HashRouter>
);

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'my-jetpack-container' );
	if ( null === container ) {
		return;
	}

	ReactDOM.render( <MyJetpack />, container );
}

render();
