import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import customContentShape from '../../tools/custom-content-shape';
import CardFresh from '../card-fresh';
import CardMigrate from '../card-migrate';
import SafeMode from '../safe-mode';

/**
 * Retrieve the main screen body.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The ScreenMain component.
 */
const ScreenMain = props => {
	const {
		wpcomHomeUrl,
		currentUrl,
		isMigrating,
		migrateCallback,
		isStartingFresh,
		startFreshCallback,
		customContent,
		hasMigrateError,
		hasFreshError,
		hasStaySafeError,
		possibleDynamicSiteUrlDetected,
	} = props;

	return (
		<React.Fragment>
			<h2>
				{ customContent.mainTitle
					? createInterpolateElement( customContent.mainTitle, { em: <em /> } )
					: __( 'Safe Mode has been activated', 'jetpack' ) }
			</h2>

			<p>
				{ createInterpolateElement(
					customContent.mainBodyText ||
						__(
							'Your site is in Safe Mode because you have 2 Jetpack-powered sites that appear to be duplicates. ' +
								'2 sites that are telling Jetpack they’re the same site. <safeModeLink>Learn more about safe mode.</safeModeLink>',
							'jetpack'
						),
					{
						safeModeLink: (
							<a
								href={ customContent.supportURL || getRedirectUrl( 'jetpack-support-safe-mode' ) }
								rel="noopener noreferrer"
								target="_blank"
							/>
						),
						em: <em />,
						strong: <strong />,
					}
				) }
			</p>

			{ possibleDynamicSiteUrlDetected && (
				<p>
					{ createInterpolateElement(
						customContent.dynamicSiteUrlText ||
							__(
								"<strong>Notice:</strong> It appears that your 'wp-config.php' file might be using dynamic site URL values. " +
									'Dynamic site URLs could cause Jetpack to enter Safe Mode. ' +
									'<dynamicSiteUrlSupportLink>Learn how to set a static site URL.</dynamicSiteUrlSupportLink>',
								'jetpack'
							),
						{
							dynamicSiteUrlSupportLink: (
								<a
									href={
										customContent.dynamicSiteUrlSupportLink ||
										getRedirectUrl( 'jetpack-idcscreen-dynamic-site-urls' )
									}
									rel="noopener noreferrer"
									target="_blank"
								/>
							),
							em: <em />,
							strong: <strong />,
						}
					) }
				</p>
			) }

			<h3>{ __( 'Please select an option', 'jetpack' ) }</h3>

			<div
				className={
					'jp-idc__idc-screen__cards' +
					( hasMigrateError || hasFreshError ? ' jp-idc__idc-screen__cards-error' : '' )
				}
			>
				<CardMigrate
					wpcomHomeUrl={ wpcomHomeUrl }
					currentUrl={ currentUrl }
					isMigrating={ isMigrating }
					migrateCallback={ migrateCallback }
					customContent={ customContent }
					hasError={ hasMigrateError }
				/>
				<div className="jp-idc__idc-screen__cards-separator">or</div>
				<CardFresh
					wpcomHomeUrl={ wpcomHomeUrl }
					currentUrl={ currentUrl }
					isStartingFresh={ isStartingFresh }
					startFreshCallback={ startFreshCallback }
					customContent={ customContent }
					hasError={ hasFreshError }
				/>
			</div>

			<SafeMode hasError={ hasStaySafeError } customContent={ customContent } />
		</React.Fragment>
	);
};

ScreenMain.propTypes = {
	/** The original site URL. */
	wpcomHomeUrl: PropTypes.string.isRequired,
	/** The current site URL */
	currentUrl: PropTypes.string.isRequired,
	/** Whether the migration is in progress. */
	isMigrating: PropTypes.bool.isRequired,
	/** Migration callback. */
	migrateCallback: PropTypes.func,
	/** Whether starting fresh is in progress. */
	isStartingFresh: PropTypes.bool.isRequired,
	/** "Start Fresh" callback. */
	startFreshCallback: PropTypes.func,
	/** Custom text content. */
	customContent: PropTypes.shape( customContentShape ),
	/** Whether the component encountered the migration error. */
	hasMigrateError: PropTypes.bool.isRequired,
	/** Whether the component encountered the "Fresh Connection" error. */
	hasFreshError: PropTypes.bool.isRequired,
	/** Whether the component encountered the "Stay in Safe Mode" error. */
	hasStaySafeError: PropTypes.bool.isRequired,
	/** If potentially dynamic HTTP_HOST usage was detected for site URLs in wp-config which can lead to a JP IDC. */
	possibleDynamicSiteUrlDetected: PropTypes.bool,
};

ScreenMain.defaultProps = {
	isMigrating: false,
	isStartingFresh: false,
	customContent: {},
	hasMigrateError: false,
	hasFreshError: false,
	hasStaySafeError: false,
	possibleDynamicSiteUrlDetected: false,
};

export default ScreenMain;
