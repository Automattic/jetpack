import { getRedirectUrl, Spinner } from '@automattic/jetpack-components';
import { Button, Dashicon } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import { STORE_ID } from '../../state/store';
import customContentShape from '../../tools/custom-content-shape';
import extractHostname from '../../tools/extract-hostname';
import ErrorMessage from '../error-message';

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
				__( 'Could not create the connection. Retry or find out more <a>here</a>.', 'jetpack' ),
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

const renderComparisonUrls = ( wpcomHostName, currentHostName ) => {
	return (
		<div>
			<div className="jp-idc__idc-screen__card-action-sitename">{ wpcomHostName }</div>
			<Dashicon icon="minus" className="jp-idc__idc-screen__card-action-separator" />
			<div className="jp-idc__idc-screen__card-action-sitename">{ currentHostName }</div>
		</div>
	);
};

/**
 * The "start fresh" card.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const CardFresh = props => {
	const {
		isStartingFresh = false,
		startFreshCallback = () => {},
		customContent = {},
		hasError = false,
		isDevelopmentSite,
	} = props;

	const wpcomHostName = extractHostname( props.wpcomHomeUrl );
	const currentHostName = extractHostname( props.currentUrl );

	const isActionInProgress = useSelect( select => select( STORE_ID ).getIsActionInProgress(), [] );

	const buttonLabel =
		customContent.startFreshButtonLabel || __( 'Create a fresh connection', 'jetpack' );

	return (
		<div
			className={
				'jp-idc__idc-screen__card-action-base' +
				( hasError ? ' jp-idc__idc-screen__card-action-error' : '' )
			}
		>
			<div className="jp-idc__idc-screen__card-action-top">
				<h4>
					{ customContent.startFreshCardTitle
						? createInterpolateElement( customContent.startFreshCardTitle, { em: <em /> } )
						: __( 'Treat each site as independent sites', 'jetpack' ) }
				</h4>

				<p>
					{ ! isDevelopmentSite
						? createInterpolateElement(
								customContent.startFreshCardBodyText ||
									sprintf(
										/* translators: %1$s: The current site domain name. %2$s: The original site domain name. */
										__(
											'<hostname>%1$s</hostname> settings, stats, and subscribers will start fresh. <hostname>%2$s</hostname> will keep its data as is.',
											'jetpack'
										),
										currentHostName,
										wpcomHostName
									),
								{
									hostname: <strong />,
									em: <em />,
									strong: <strong />,
								}
						  )
						: createInterpolateElement(
								customContent.startFreshCardBodyText ||
									sprintf(
										/* translators: %1$s: The current site domain name. %2$s: The original site domain name. */
										__(
											'<p><strong>Recommended for</strong></p>' +
												'<list><item>development sites</item><item>sites that need access to all Jetpack features</item></list>' +
												'<p><strong>Please note</strong> that creating a fresh connection for <hostname>%1$s</hostname> would require restoring the connection on <hostname>%2$s</hostname> if that site is cloned back to production. ' +
												'<safeModeLink>Learn more</safeModeLink>.</p>',
											'jetpack'
										),
										currentHostName,
										wpcomHostName
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
				</p>
			</div>

			<div className="jp-idc__idc-screen__card-action-bottom">
				<div>
					{ ! isDevelopmentSite ? renderComparisonUrls( wpcomHostName, currentHostName ) : null }
				</div>
				<Button
					className="jp-idc__idc-screen__card-action-button"
					label={ buttonLabel }
					onClick={ startFreshCallback }
					disabled={ isActionInProgress }
				>
					{ isStartingFresh ? <Spinner /> : buttonLabel }
				</Button>

				{ hasError && renderError( customContent.supportURL ) }
			</div>
		</div>
	);
};

CardFresh.propTypes = {
	/** The original site URL. */
	wpcomHomeUrl: PropTypes.string.isRequired,
	/** The current site URL. */
	currentUrl: PropTypes.string.isRequired,
	/** Whether starting fresh is in progress. */
	isStartingFresh: PropTypes.bool,
	/** "Start Fresh" callback. */
	startFreshCallback: PropTypes.func,
	/** Custom text content. */
	customContent: PropTypes.shape( customContentShape ),
	/** Whether the component has an error. */
	hasError: PropTypes.bool,
	/** Whether the site is in development mode. */
	isDevelopmentSite: PropTypes.bool,
};

export default CardFresh;
