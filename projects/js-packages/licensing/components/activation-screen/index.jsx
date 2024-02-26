import jetpackAnalytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import ActivationScreenControls from '../activation-screen-controls';
import ActivationScreenIllustration from '../activation-screen-illustration';
import ActivationScreenSuccessInfo from '../activation-screen-success-info';
import GoldenTokenModal from '../golden-token-modal';
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
 * @param {string} props.currentUser -- Current wpcom user info.
 * @returns {React.Component} The `ActivationScreen` component.
 */
const ActivationScreen = props => {
	const {
		availableLicenses = [],
		currentRecommendationsStep,
		fetchingAvailableLicenses = false,
		onActivationSuccess = () => null,
		siteAdminUrl,
		siteRawUrl,
		startingLicense,
		displayName = '',
	} = props;

	const [ license, setLicense ] = useState( startingLicense ?? '' );
	const [ licenseError, setLicenseError ] = useState( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ activatedProduct, setActivatedProduct ] = useState( null );

	useEffect( () => {
		if ( availableLicenses && availableLicenses[ 0 ] ) {
			setLicense( availableLicenses[ 0 ].license_key );
		}
	}, [ availableLicenses ] );

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
				jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_license_activation_error' );

				const cannotManageLicenses =
					error.response?.code === 'invalid_permission_manage_user_licenses';
				if ( cannotManageLicenses ) {
					setLicenseError(
						createInterpolateElement(
							__(
								'You either do not have permissions to perform this action or a user account needs to be connected. <connectLink>Click here to connect your user account</connectLink> or contact your administrator.',
								'jetpack'
							),
							{
								connectLink: (
									<a href="admin.php?page=my-jetpack#/connection?returnTo=add-license" />
								),
							}
						)
					);

					return;
				}

				setLicenseError( error.message );
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
				availableLicenses={ availableLicenses }
				activateLicense={ activateLicense }
				fetchingAvailableLicenses={ fetchingAvailableLicenses }
				isActivating={ isSaving }
				license={ license }
				licenseError={ licenseError }
				onLicenseChange={ setLicense }
				siteUrl={ siteRawUrl }
			/>
			<ActivationScreenIllustration imageUrl={ lockImage } showSupportLink />
		</div>
	);

	const renderGoldenTokenModal = () => {
		return <GoldenTokenModal tokenRedeemed={ true } displayName={ displayName } />;
	};

	if ( null !== activatedProduct && license.startsWith( 'jetpack-golden-token' ) ) {
		return renderGoldenTokenModal();
	}

	return null !== activatedProduct ? renderActivationSuccess() : renderActivationControl();
};

ActivationScreen.propTypes = {
	availableLicenses: PropTypes.array,
	currentRecommendationsStep: PropTypes.string,
	fetchingAvailableLicenses: PropTypes.bool,
	onActivationSuccess: PropTypes.func,
	siteAdminUrl: PropTypes.string.isRequired,
	siteRawUrl: PropTypes.string.isRequired,
	startingLicense: PropTypes.string,
	displayName: PropTypes.string,
};

export default ActivationScreen;
