import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import customContentShape from '../../tools/custom-content-shape';
import extractHostname from '../../tools/extract-hostname';
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
		isMigrating = false,
		migrateCallback,
		isStartingFresh = false,
		startFreshCallback,
		customContent = {},
		hasMigrateError = false,
		hasFreshError = false,
		hasStaySafeError = false,
		possibleDynamicSiteUrlDetected = false,
		isDevelopmentSite,
	} = props;
	const wpcomHostName = extractHostname( props.wpcomHomeUrl );
	const currentHostName = extractHostname( props.currentUrl );

	return (
		<React.Fragment>
			<h2>
				{ customContent.mainTitle
					? createInterpolateElement( customContent.mainTitle, { em: <em /> } )
					: __( 'Safe Mode has been activated', 'jetpack' ) }
			</h2>

			<p>
				{ ! isDevelopmentSite
					? createInterpolateElement(
							customContent.mainBodyText ||
								__(
									'Your site is in Safe Mode because you have 2 Jetpack-powered sites that appear to be duplicates. ' +
										'Two sites that are telling Jetpack they’re the same site. <safeModeLink>Learn more about safe mode.</safeModeLink>',
									'jetpack'
								),
							{
								safeModeLink: (
									<a
										href={
											customContent.supportURL || getRedirectUrl( 'jetpack-support-safe-mode' )
										}
										rel="noopener noreferrer"
										target="_blank"
									/>
								),
								em: <em />,
								strong: <strong />,
							}
					  )
					: createInterpolateElement(
							customContent.mainBodyText ||
								sprintf(
									/* translators: %1$s: The current site domain name. %2$s: The original site domain name. */
									__(
										'<span>Your site is in Safe Mode because <hostname>%1$s</hostname> appears to be a staging or development copy of <hostname>%2$s</hostname>.</span>' +
											'2 sites that are telling Jetpack they’re the same site. <safeModeLink>Learn more or troubleshoot common Safe mode issues</safeModeLink>.',
										'jetpack'
									),
									currentHostName,
									wpcomHostName
								),
							{
								span: <span style={ { display: 'block' } } />,
								hostname: <strong />,
								em: <em />,
								strong: <strong />,
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
				{ ! isDevelopmentSite ? (
					<React.Fragment>
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
							isDevelopmentSite={ isDevelopmentSite }
						/>
					</React.Fragment>
				) : (
					<React.Fragment>
						<CardFresh
							wpcomHomeUrl={ wpcomHomeUrl }
							currentUrl={ currentUrl }
							isStartingFresh={ isStartingFresh }
							startFreshCallback={ startFreshCallback }
							customContent={ customContent }
							hasError={ hasFreshError }
							isDevelopmentSite={ isDevelopmentSite }
						/>
						<div className="jp-idc__idc-screen__cards-separator">or</div>
						<SafeMode
							hasError={ hasStaySafeError }
							customContent={ customContent }
							isDevelopmentSite={ isDevelopmentSite }
						/>
					</React.Fragment>
				) }
			</div>
			{ ! isDevelopmentSite ? (
				<SafeMode hasError={ hasStaySafeError } customContent={ customContent } />
			) : null }
		</React.Fragment>
	);
};

ScreenMain.propTypes = {
	/** The original site URL. */
	wpcomHomeUrl: PropTypes.string.isRequired,
	/** The current site URL */
	currentUrl: PropTypes.string.isRequired,
	/** Whether the migration is in progress. */
	isMigrating: PropTypes.bool,
	/** Migration callback. */
	migrateCallback: PropTypes.func,
	/** Whether starting fresh is in progress. */
	isStartingFresh: PropTypes.bool,
	/** "Start Fresh" callback. */
	startFreshCallback: PropTypes.func,
	/** Custom text content. */
	customContent: PropTypes.shape( customContentShape ),
	/** Whether the component encountered the migration error. */
	hasMigrateError: PropTypes.bool,
	/** Whether the component encountered the "Fresh Connection" error. */
	hasFreshError: PropTypes.bool,
	/** Whether the component encountered the "Stay in Safe Mode" error. */
	hasStaySafeError: PropTypes.bool,
	/** If potentially dynamic HTTP_HOST usage was detected for site URLs in wp-config which can lead to a JP IDC. */
	possibleDynamicSiteUrlDetected: PropTypes.bool,
	/** Whether the site is in development mode. */
	isDevelopmentSite: PropTypes.bool,
};

export default ScreenMain;
