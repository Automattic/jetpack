import jetpackAnalytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import ActivationScreenControls from '../activation-screen-controls';
import ActivationScreenIllustration from '../activation-screen-illustration';
import ActivationScreenSuccessInfo from '../activation-screen-success-info';
import lockImage from '../jetpack-license-activation-with-lock.png';
import successImage from '../jetpack-license-activation-with-success.png';

import './style.scss';

/**
 * attachLicenses has a particular result, which we reduce to the parts we care about here
 *
 * @param {(object|Array)} result -- the result from the attachLicenses request
 * @returns {number} The activatedProductId from the result
 * @throws Errors either from the API response or from any issues parsing the response
 */
const parseAttachLicensesResult = result => {
	let currentResult = result;

	while ( Array.isArray( currentResult ) && currentResult.length > 0 ) {
		currentResult = currentResult[ 0 ];
	}

	if ( currentResult?.activatedProductId ) {
		return currentResult.activatedProductId;
	} else if ( currentResult?.errors ) {
		for ( const errorCode in currentResult.errors ) {
			if ( currentResult.errors[ errorCode ].length > 0 ) {
				throw new Error( currentResult.errors[ errorCode ][ 0 ] );
			}
		}
	}

	throw new Error(
		__( 'An unknown error occurred during license activation. Please try again.', 'jetpack' )
	);
};

/**
 * The Activation Screen component.
 *
 * @param {object} props -- The properties.
 * @param {Function?} props.onActivationSuccess -- A function to call on success.
 * @param {string} props.siteRawUrl -- url of the Jetpack Site
 * @param {string?} props.startingLicense -- pre-fill the license value
 * @param {string} props.siteAdminUrl -- URL of the Jetpack Site Admin
 * @param {string} props.currentRecommendationsStep -- The current recommendation step.
 * @returns {React.Component} The `ActivationScreen` component.
 */
const ActivationScreen = props => {
	const {
		currentRecommendationsStep,
		detachedLicenses = [],
		fetchingDetachedLicenses = false,
		onActivationSuccess = () => null,
		siteAdminUrl,
		siteRawUrl,
		startingLicense,
	} = props;

	const [ license, setLicense ] = useState( startingLicense ?? '' );
	const [ licenseError, setLicenseError ] = useState( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ activatedProduct, setActivatedProduct ] = useState( null );

	useEffect( () => {
		const { apiRoot, apiNonce } = window?.myJetpackRest || {};
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [] );

	useEffect( () => {
		if ( detachedLicenses && detachedLicenses[ 0 ] ) {
			setLicense( detachedLicenses[ 0 ].license_key );
		}
	}, [ detachedLicenses ] );

	const activateLicense = useCallback( () => {
		if ( isSaving ) {
			return Promise.resolve();
		}
		if ( license.length < 1 ) {
			setLicenseError( __( 'This is not a valid license key. Please try again.', 'jetpack' ) );
			return Promise.resolve();
		}

		setLicenseError( null );
		setIsSaving( true );

		jetpackAnalytics.tracks.recordJetpackClick( { target: 'license_activation_button' } );

		// returning our promise chain makes testing a bit easier ( see ./test/components.jsx - "should render an error from API" )
		return restApi
			.attachLicenses( [ license ] )
			.then( result => {
				const activatedProductId = parseAttachLicensesResult( result );
				setActivatedProduct( activatedProductId );
				onActivationSuccess( activatedProductId );
				jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_license_activation_success' );
			} )
			.catch( error => {
				setLicenseError( error.message );
				jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_license_activation_error' );
			} )
			.finally( () => {
				setIsSaving( false );
			} );
	}, [ isSaving, license, onActivationSuccess ] );

	const renderActivationSuccess = () => (
		<div className="jp-license-activation-screen">
			<ActivationScreenSuccessInfo
				siteRawUrl={ siteRawUrl }
				productId={ activatedProduct }
				siteAdminUrl={ siteAdminUrl }
				currentRecommendationsStep={ currentRecommendationsStep }
			/>
			<ActivationScreenIllustration imageUrl={ successImage } showSupportLink={ false } />
		</div>
	);

	const renderActivationControl = () => (
		<div className="jp-license-activation-screen">
			<ActivationScreenControls
				activateLicense={ activateLicense }
				detachedLicenses={ detachedLicenses }
				fetchingDetachedLicenses={ fetchingDetachedLicenses }
				isActivating={ isSaving }
				license={ license }
				licenseError={ licenseError }
				onLicenseChange={ setLicense }
				siteUrl={ siteRawUrl }
			/>
			<ActivationScreenIllustration imageUrl={ lockImage } showSupportLink />
		</div>
	);

	return null !== activatedProduct ? renderActivationSuccess() : renderActivationControl();
};

ActivationScreen.propTypes = {
	currentRecommendationsStep: PropTypes.string,
	detachedLicenses: PropTypes.array,
	fetchingDetachedLicenses: PropTypes.bool,
	onActivationSuccess: PropTypes.func,
	siteAdminUrl: PropTypes.string.isRequired,
	siteRawUrl: PropTypes.string.isRequired,
	startingLicense: PropTypes.string,
};

export default ActivationScreen;
