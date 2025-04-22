import jetpackAnalytics from '@automattic/jetpack-analytics';
import { JetpackLogo, Spinner } from '@automattic/jetpack-components';
import { Button, TextControl, SelectControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ActivationScreenError from '../activation-screen-error';
import { LICENSE_ERRORS } from '../activation-screen-error/constants';
import './style.scss';

/**
 * The Activation Screen Controls component.
 *
 * @param {object}   props           -- The properties.
 * @param {Function} props.className -- class name of the input control.
 * @param {boolean}  props.disabled  -- determines if input control is disabled.
 * @param {string}   props.value     -- the license code to edit or submit
 * @param {Function} props.onChange  -- function to handle changes to the value.
 * @return {React.Component} The `ManualLicenseKeyInput` component.
 */
const ManualLicenseKeyInput = props => {
	const { className, disabled, onChange, value } = props;

	return (
		<TextControl
			__nextHasNoMarginBottom={ true }
			__next40pxDefaultSize
			className={ className }
			label={ __( 'License key', 'jetpack-licensing' ) }
			value={ value }
			onChange={ onChange }
			disabled={ disabled }
		/>
	);
};

/**
 * The Activation Screen Controls component.
 *
 * @param {object}   props                   -- The properties.
 * @param {Function} props.className         -- class name of the input control.
 * @param {Array}    props.availableLicenses -- list of available license keys for activation.
 * @param {boolean}  props.disabled          -- determines if input control is disabled.
 * @param {string}   props.value             -- the license code to edit or submit
 * @param {Function} props.onChange          -- function to handle changes to the value.
 * @return {React.Component} The `SelectableLicenseKeyInput` component.
 */
const SelectableLicenseKeyInput = props => {
	const { className, availableLicenses, disabled, onChange, value } = props;
	const [ selectedOption, setSelectedOption ] = useState( '' );
	const isFetching = availableLicenses === null;

	const options = useMemo( () => {
		if ( isFetching ) {
			return [
				{
					label: __( 'Fetching available licenses…', 'jetpack-licensing' ),
					value: '',
				},
			];
		}

		return [
			...availableLicenses.map( ( { product, license_key } ) => {
				return {
					label: sprintf(
						/* translators: placeholder is the product name and license key */
						__( '%1$s - %2$s', 'jetpack-licensing' ),
						product,
						license_key
					),
					value: license_key,
				};
			} ),
			{
				label: __( 'I want to add a license key manually', 'jetpack-licensing' ),
				value: '',
			},
		];
	}, [ availableLicenses, isFetching ] );

	useEffect( () => {
		if ( options?.length ) {
			setSelectedOption( options[ 0 ].value );
		} else {
			setSelectedOption( '' );
		}
	}, [ options ] );

	const onSelectionChange = useCallback(
		val => {
			setSelectedOption( val );
			onChange( val );
		},
		[ onChange ]
	);

	return (
		<>
			<SelectControl
				__nextHasNoMarginBottom={ true }
				__next40pxDefaultSize
				className={ className }
				disabled={ disabled }
				label={ __( 'Select a license key', 'jetpack-licensing' ) }
				value={ selectedOption }
				options={ options }
				onChange={ onSelectionChange }
			/>

			{ ! isFetching && ! selectedOption && (
				<TextControl
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize
					className={ className }
					label={ __( 'Input a license key', 'jetpack-licensing' ) }
					value={ value }
					onChange={ onChange }
					disabled={ disabled }
				/>
			) }
		</>
	);
};

/**
 * The Activation Screen Controls component.
 *
 * @param {object}   props                           -- The properties.
 * @param {Function} props.activateLicense           -- function to handle submitting a license
 * @param {Array}    props.availableLicenses         -- list of available license keys for activation.
 * @param {boolean}  props.fetchingAvailableLicenses -- status to determine if the screen is fetching available license keys.
 * @param {boolean}  props.isActivating              -- should the controls be disabled
 * @param {string}   props.license                   -- the license code to edit or submit
 * @param {?string}  props.licenseError              -- any error that occurred while activating a license
 * @param {Function} props.onLicenseChange           -- function to handle changes to license
 * @param {string}   props.siteUrl                   -- the url of the site
 * @return {React.Component} The `ActivationScreenControls` component.
 */
const ActivationScreenControls = props => {
	const {
		activateLicense,
		availableLicenses,
		fetchingAvailableLicenses,
		isActivating,
		license,
		licenseError,
		onLicenseChange,
	} = props;

	useEffect( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_license_key_activation_view' );
	}, [] );

	const errorTypeMatch = licenseError?.match( /\[[a-z_]+\]/ );
	const errorType = errorTypeMatch && errorTypeMatch[ 0 ];

	const { ACTIVE_ON_SAME_SITE } = LICENSE_ERRORS;
	const isLicenseAlreadyAttached = ACTIVE_ON_SAME_SITE === errorType;
	const className = useMemo( () => {
		if ( ! licenseError ) {
			return 'jp-license-activation-screen-controls--license-field';
		}
		if ( isLicenseAlreadyAttached ) {
			return 'jp-license-activation-screen-controls--license-field-with-success';
		}

		return 'jp-license-activation-screen-controls--license-field-with-error';
	}, [ licenseError, isLicenseAlreadyAttached ] );

	const hasAvailableLicenseKey = availableLicenses && availableLicenses.length;

	return (
		<div className="jp-license-activation-screen-controls">
			<div className="jp-license-activation-screen-controls--content">
				<JetpackLogo showText={ false } height={ 48 } />
				<h1>{ __( 'Add a license key', 'jetpack-licensing' ) }</h1>
				<p>
					{ createInterpolateElement(
						__(
							'<strong>Check your email</strong> for your license key. You should have received it after making your purchase.',
							'jetpack-licensing'
						),
						{
							strong: <strong></strong>,
						}
					) }
				</p>
				{ fetchingAvailableLicenses || hasAvailableLicenseKey ? (
					<SelectableLicenseKeyInput
						className={ className }
						disabled={ fetchingAvailableLicenses || isActivating }
						onChange={ onLicenseChange }
						availableLicenses={ fetchingAvailableLicenses ? null : availableLicenses }
						value={ license }
					/>
				) : (
					<ManualLicenseKeyInput
						className={ className }
						disabled={ isActivating }
						onChange={ onLicenseChange }
						value={ license }
					/>
				) }
				{ licenseError && (
					<ActivationScreenError licenseError={ licenseError } errorType={ errorType } />
				) }
			</div>
			<div>
				<Button
					className="jp-license-activation-screen-controls--button"
					onClick={ activateLicense }
					disabled={ ! license }
				>
					{ isActivating ? <Spinner /> : __( 'Activate', 'jetpack-licensing' ) }
				</Button>
			</div>
		</div>
	);
};

ActivationScreenControls.propTypes = {
	activateLicense: PropTypes.func.isRequired,
	availableLicenses: PropTypes.array,
	fetchingAvailableLicenses: PropTypes.bool,
	isActivating: PropTypes.bool.isRequired,
	license: PropTypes.string.isRequired,
	licenseError: PropTypes.string,
	onLicenseChange: PropTypes.func.isRequired,
	siteUrl: PropTypes.string.isRequired,
};

export default ActivationScreenControls;
