import jetpackAnalytics from '@automattic/jetpack-analytics';
import { JetpackLogo } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { Button, InputControl, SelectControl, Stack, Text } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ActivationScreenError from '../activation-screen-error';
import { LICENSE_ERRORS } from '../activation-screen-error/constants';
import './style.scss';

// Sentinel value for the "add a license key manually" option so the SelectControl
// shows that option (rather than the empty-value placeholder) while the manual
// text input is displayed.
const MANUAL_ENTRY = '__manual_entry__';

/**
 * The Activation Screen Controls component.
 *
 * @param {object}   props           -- The properties.
 * @param {Function} props.className -- class name of the input control.
 * @param {boolean}  props.disabled  -- determines if input control is disabled.
 * @param {string}   props.value     -- the license code to edit or submit
 * @param {Function} props.onChange  -- function to handle changes to the value.
 * @return {import('react').Component} The `ManualLicenseKeyInput` component.
 */
const ManualLicenseKeyInput = props => {
	const { className, disabled, onChange, value } = props;

	return (
		<InputControl
			className={ className }
			label={ __( 'License key', 'jetpack-licensing' ) }
			value={ value }
			onValueChange={ onChange }
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
 * @return {import('react').Component} The `SelectableLicenseKeyInput` component.
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
						/* translators: %1$s: the product name, %2$s: the license key */
						__( '%1$s - %2$s', 'jetpack-licensing' ),
						product,
						license_key
					),
					value: license_key,
				};
			} ),
			{
				label: __( 'I want to add a license key manually', 'jetpack-licensing' ),
				value: MANUAL_ENTRY,
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

	// The @wordpress/ui SelectControl is item-object based: `value` is the
	// selected item and `onValueChange` receives the item, so map to/from the
	// stored string value.
	const activeItem = useMemo(
		() => options.find( option => option.value === selectedOption ) ?? options[ 0 ],
		[ options, selectedOption ]
	);

	const onSelectionChange = useCallback(
		item => {
			const val = item?.value ?? '';
			setSelectedOption( val );
			// Manual entry has no key yet — clear the stored license so the button
			// stays disabled until the user types one.
			onChange( val === MANUAL_ENTRY ? '' : val );
		},
		[ onChange ]
	);

	return (
		<>
			<SelectControl
				className={ className }
				disabled={ disabled }
				label={ __( 'Select a license key', 'jetpack-licensing' ) }
				value={ activeItem }
				items={ options }
				onValueChange={ onSelectionChange }
			/>

			{ ! isFetching && selectedOption === MANUAL_ENTRY && (
				<InputControl
					className={ className }
					label={ __( 'Input a license key', 'jetpack-licensing' ) }
					value={ value }
					onValueChange={ onChange }
					disabled={ disabled }
				/>
			) }
		</>
	);
};

/**
 * The Activation Screen Controls component.
 *
 * @param {object}                              props                           -- The properties.
 * @param {Function}                            props.activateLicense           -- function to handle submitting a license
 * @param {Array}                               props.availableLicenses         -- list of available license keys for activation.
 * @param {boolean}                             props.fetchingAvailableLicenses -- status to determine if the screen is fetching available license keys.
 * @param {boolean}                             props.isActivating              -- should the controls be disabled
 * @param {string}                              props.license                   -- the license code to edit or submit
 * @param {string|import('react').ReactElement} props.licenseError              -- any error that occurred while activating a license
 * @param {Function}                            props.onLicenseChange           -- function to handle changes to license
 * @param {string}                              props.siteUrl                   -- the url of the site
 * @return {import('react').Component} The `ActivationScreenControls` component.
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

	const errorTypeMatch =
		typeof licenseError === 'string' ? licenseError?.match( /\[[a-z_]+\]/ ) : null;
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
		<Stack
			className="jp-license-activation-screen-controls"
			direction="column"
			justify="space-between"
			gap="xl"
		>
			<Stack direction="column" gap="2xl">
				<Stack direction="column" gap="2xl" align="flex-start">
					<JetpackLogo showText={ false } height={ 48 } />
					<Text render={ <h1 /> } variant="heading-2xl">
						{ __( 'Add a license key', 'jetpack-licensing' ) }
					</Text>
				</Stack>
				<Stack direction="column" gap="lg">
					<Text variant="body-lg">
						{ createInterpolateElement(
							__(
								'<strong>Purchased a plan?</strong><br />Check your email for your license key and paste it below.',
								'jetpack-licensing'
							),
							{
								strong: <strong />,
								br: <br />,
							}
						) }
					</Text>
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
				</Stack>
			</Stack>
			<div>
				<Button
					className="jp-license-activation-screen-controls--button"
					variant="solid"
					loading={ isActivating }
					onClick={ activateLicense }
					disabled={ ! license || isActivating }
				>
					{ __( 'Activate', 'jetpack-licensing' ) }
				</Button>
			</div>
		</Stack>
	);
};

ActivationScreenControls.propTypes = {
	activateLicense: PropTypes.func.isRequired,
	availableLicenses: PropTypes.array,
	fetchingAvailableLicenses: PropTypes.bool,
	isActivating: PropTypes.bool.isRequired,
	license: PropTypes.string.isRequired,
	licenseError: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	onLicenseChange: PropTypes.func.isRequired,
	siteUrl: PropTypes.string.isRequired,
};

export default ActivationScreenControls;
