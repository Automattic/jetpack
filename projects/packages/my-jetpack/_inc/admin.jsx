/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Container, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import MyJetpackScreen from './components/my-jetpack-screen';
import ConnectionScreen from './components/connection-screen';
import { initStore } from './state/store';
import { BoostInterstitial } from './components/product-interstitial';
import GoBackLink from './components/go-back-link';

initStore();

/**
 * Main layout component.
 * Takes it as an initil basic approach that
 * could get more complex in the future.
 *
 * @param {object} props          - Component props.
 * @param {boolean} props.nav     - Header navigation.
 * @param {object} props.children - Child components.
 * @returns {object}                Layout react component.
 */
function Layout( { nav = false, children } ) {
	if ( ! nav ) {
		return children;
	}

	const headerNav = nav ? (
		<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
			<Col>
				<GoBackLink />
			</Col>
		</Container>
	) : null;

	return (
		<>
			{ headerNav }
			{ children }
		</>
	);
}

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'my-jetpack-container' );
	if ( null === container ) {
		return;
	}

	ReactDOM.render(
		<HashRouter>
			<Routes>
				<Route path="/" element={ <MyJetpackScreen /> } />
				<Route
					path="/connection"
					element={ <Layout nav={ true } children={ <ConnectionScreen /> } /> }
				/>
				<Route
					path="/add-boost"
					element={ <Layout nav={ true } children={ <BoostInterstitial /> } /> }
				/>
			</Routes>
		</HashRouter>,
		container
	);
}

render();
