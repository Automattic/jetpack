/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React, { useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Container, Col, JetpackFooter } from '@automattic/jetpack-components';
import classNames from 'classnames';

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
import CloseLink from './components/close-link';
import styles from './style.module.scss';
import useAnalytics from './hooks/use-analytics';

initStore();

const NAV_TYPES = {
	LINK: 'link',
	CLOSE: 'close',
};

/**
 * Main layout component.
 * Takes it as an initil basic approach that
 * could get more complex in the future.
 *
 * @param {object} props          - Component props.
 * @param {object} props.children - Child components.
 * @param {string} props.slug     - A product slug or undefined. Will Fire Tracks event with product:slug if not undefined
 * @param {string} props.navType  - Type of nav that will be used
 * @returns {object}                Layout react component.
 */
function Layout( { children, slug, navType = NAV_TYPES.LINK } ) {
	const {
		tracks: { recordEvent },
	} = useAnalytics();

	const onClick = useCallback( () => {
		if ( slug ) {
			recordEvent( 'jetpack_myjetpack_product_interstitial_back_link_click', { product: slug } );
		}
	}, [ recordEvent, slug ] );

	const navColClassName = classNames( {
		[ styles[ 'relative-col' ] ]: navType === NAV_TYPES.CLOSE,
	} );

	let containerProps = {};
	let navComponent = null;

	switch ( navType ) {
		case NAV_TYPES.CLOSE:
			navComponent = <CloseLink className={ styles[ 'close-link' ] } />;
			containerProps = {
				horizontalGap: 0,
				horizontalSpacing: 8,
			};
			break;
		case NAV_TYPES.LINK:
		default:
			navComponent = <GoBackLink onClick={ onClick } />;
			containerProps = {
				horizontalSpacing: 3,
				horizontalGap: 3,
			};
			break;
	}

	return (
		<div className={ styles.layout }>
			<Container { ...containerProps }>
				<Col className={ navColClassName }>{ navComponent }</Col>
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
				element={ <Layout navType="close" children={ <ConnectionScreen /> } /> }
			/>
			<Route
				path="/add-anti-spam"
				element={ <Layout children={ <AntiSpamInterstitial /> } slug="anti-spam" /> }
			/>
			<Route
				path="/add-backup"
				element={ <Layout children={ <BackupInterstitial /> } slug="backup" /> }
			/>
			<Route
				path="/add-boost"
				element={ <Layout children={ <BoostInterstitial /> } slug="boost" /> }
			/>
			<Route path="/add-crm" element={ <Layout children={ <CRMInterstitial /> } slug="crm" /> } />
			<Route
				path="/add-scan"
				element={ <Layout children={ <ScanInterstitial /> } slug="scan" /> }
			/>
			<Route
				path="/add-search"
				element={ <Layout children={ <SearchInterstitial /> } slug="search" /> }
			/>
			<Route
				path="/add-videopress"
				element={ <Layout children={ <VideoPressInterstitial /> } slug="videopress" /> }
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
