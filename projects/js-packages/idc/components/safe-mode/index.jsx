import restApi from '@automattic/jetpack-api';
import { getRedirectUrl, Spinner } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { removeQueryArgs } from '@wordpress/url';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { STORE_ID } from '../../state/store';
import customContentShape from '../../tools/custom-content-shape';
import trackAndBumpMCStats from '../../tools/tracking';
import ErrorMessage from '../error-message';
import './style.scss';

/**
 * Render the "Stay safe" button.
 *
 * @param {Function} callback - Button click callback.
 * @param {boolean} isDisabled - Whether the button should be disabled.
 * @returns {React.Component} - The rendered output.
 */

const renderStaySafeButton = ( callback, isDisabled ) => {
	return createInterpolateElement(
		__( 'Or decide later and stay in <button>Safe mode</button>', 'jetpack' ),
		{
			button: (
				<Button
					label={ __( 'Safe mode', 'jetpack' ) }
					variant="link"
					onClick={ callback }
					disabled={ isDisabled }
				/>
			),
		}
	);
};

/**
 * Render the "staying safe" line.
 *
 * @returns {React.Component} - The rendered output.
 */
const renderStayingSafe = () => {
	return (
		<div className="jp-idc__safe-mode__staying-safe">
			<Spinner color="black" />
			<span>{ __( 'Finishing setting up Safe mode…', 'jetpack' ) }</span>
		</div>
	);
};

/**
 * Render the error message.
 *
 * @param {string} supportURL - The support page URL.
 * @returns {React.Component} The error message.
 */
const renderError = supportURL => {
	return (
		<ErrorMessage>
			{ createInterpolateElement(
				__( 'Could not stay in safe mode. Retry or find out more <a>here</a>.', 'jetpack' ),
				{
					a: (
						<a
							href={ supportURL || getRedirectUrl( 'jetpack-support-safe-mode' ) }
							rel="noopener noreferrer"
							target="_blank"
						/>
					),
				}
			) }
		</ErrorMessage>
	);
};

const SafeMode = props => {
	const {
		isActionInProgress,
		setIsActionInProgress,
		setErrorType,
		clearErrorType,
		hasError = false,
		customContent,
		isDevelopmentSite,
	} = props;
	const [ isStayingSafe, setIsStayingSafe ] = useState( false );

	const buttonLabel =
		customContent.stayInSafeModeButtonLabel || __( 'Stay in Safe mode', 'jetpack' );

	const staySafeCallback = useCallback( () => {
		if ( ! isActionInProgress ) {
			setIsStayingSafe( true );
			setIsActionInProgress( true );
			clearErrorType();

			trackAndBumpMCStats( 'confirm_safe_mode' );

			restApi
				.confirmIDCSafeMode()
				.then( () => {
					window.location.href = removeQueryArgs(
						window.location.href,
						'jetpack_idc_clear_confirmation',
						'_wpnonce'
					);
				} )
				.catch( error => {
					setIsActionInProgress( false );
					setIsStayingSafe( false );
					setErrorType( 'safe-mode' );
					throw error;
				} );
		}
	}, [ isActionInProgress, setIsActionInProgress, setErrorType, clearErrorType ] );

	return (
		<React.Fragment>
			{ ! isDevelopmentSite ? (
				<div className="jp-idc__safe-mode">
					{ isStayingSafe
						? renderStayingSafe()
						: renderStaySafeButton( staySafeCallback, isActionInProgress ) }

					{ hasError && renderError( customContent.supportURL ) }
				</div>
			) : (
				<div
					className={
						'jp-idc__idc-screen__card-action-base' +
						( hasError ? ' jp-idc__idc-screen__card-action-error' : '' )
					}
				>
					<div className="jp-idc__idc-screen__card-action-top">
						<h4>
							{ customContent.safeModeTitle
								? createInterpolateElement( customContent.safeModeTitle, { em: <em /> } )
								: __( 'Stay in Safe Mode', 'jetpack' ) }
						</h4>

						<div>
							{ createInterpolateElement(
								customContent.startFreshCardBodyText ||
									/* translators: %1$s: The current site domain name. %2$s: The original site domain name. */
									__(
										'<p><strong>Recommended for</strong></p>' +
											'<list><item>short-lived test sites</item><item>sites that will be cloned back to production after testing</item></list>' +
											'<p><strong>Please note</strong> that staying in Safe mode will disable some Jetpack features, including security features such as SSO, firewall, and site monitor. ' +
											'<safeModeLink>Learn more</safeModeLink>.</p>',
										'jetpack'
									),
								{
									p: <p />,
									hostname: <strong />,
									em: <em />,
									strong: <strong />,
									list: <ul />,
									item: <li />,
									safeModeLink: (
										<a
											href={
												customContent.supportURL || getRedirectUrl( 'jetpack-support-safe-mode' )
											}
											rel="noopener noreferrer"
											target="_blank"
										/>
									),
								}
							) }
						</div>
					</div>

					<div className="jp-idc__idc-screen__card-action-bottom">
						<Button
							className="jp-idc__idc-screen__card-action-button-secondary"
							label={ buttonLabel }
							onClick={ staySafeCallback }
							disabled={ isActionInProgress }
						>
							{ isStayingSafe ? <Spinner color="black" /> : buttonLabel }
						</Button>

						{ hasError && renderError( customContent.supportURL ) }
					</div>
				</div>
			) }
		</React.Fragment>
	);
};

SafeMode.propTypes = {
	/** Whether there's already an action in progress. */
	isActionInProgress: PropTypes.bool,
	/** Function to set the "action in progress" flag. */
	setIsActionInProgress: PropTypes.func.isRequired,
	/** Function to set the error type. */
	setErrorType: PropTypes.func.isRequired,
	/** Function to clear the error. */
	clearErrorType: PropTypes.func.isRequired,
	/** Whether the component has an error. */
	hasError: PropTypes.bool,
	/** Custom text content. */
	customContent: PropTypes.shape( customContentShape ),
	isDevelopmentSite: PropTypes.bool,
};

export default compose( [
	withSelect( select => {
		return {
			isActionInProgress: select( STORE_ID ).getIsActionInProgress(),
		};
	} ),
	withDispatch( dispatch => {
		return {
			setIsActionInProgress: dispatch( STORE_ID ).setIsActionInProgress,
			setErrorType: dispatch( STORE_ID ).setErrorType,
			clearErrorType: dispatch( STORE_ID ).clearErrorType,
		};
	} ),
] )( SafeMode );
