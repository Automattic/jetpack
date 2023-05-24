import restApi from '@automattic/jetpack-api';
import {
	getScoreLetter,
	// requestSpeedScores,
	// didScoresChange,
} from '@automattic/jetpack-boost-score-api';
import { BoostScoreBar, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import InfoPopover from 'components/info-popover';
import PluginInstallSection from 'components/plugin-install-section';
import SectionHeader from 'components/section-header';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { getSiteConnectionStatus } from 'state/connection';
import { getApiRootUrl, getApiNonce, getSiteRawUrl } from 'state/initial-state';
import { hasActiveBoostPurchase as getActiveBoostPurchase } from 'state/site';
import {
	isFetchingPluginsData,
	isPluginInstalled,
	isPluginActive,
	fetchPluginsData as dispatchFetchPluginsData,
} from 'state/site/plugins';
import './style.scss';

const BOOST_PLUGIN_DASH = 'admin.php?page=jetpack-boost';
const BOOST_PLUGIN_FILES = [
	'jetpack-boost/jetpack-boost.php',
	'jetpack-boost-dev/jetpack-boost.php',
];
const BOOST_PLUGIN_SLUG = 'jetpack-boost';

const DashBoost = ( {
	siteAdminUrl,
	siteConnectionStatus,
	//	siteUrl,
	//	apiRoot,
	//	apiNonce,
	fetchPluginsData,
	fetchingPluginsData,
	isBoostInstalled,
	isBoostActive,
	hasActiveBoostPurchase,
} ) => {
	const isSiteOffline = siteConnectionStatus === 'offline';

	const [ isLoading, setIsLoading ] = useState( true );
	const [ isInstalling, setIsInstalling ] = useState( false );
	const [ isActivating, setIsActivating ] = useState( false );
	const [ speedLetterGrade, setSpeedLetterGrade ] = useState( 'C' );
	const [ daysSinceTested, setDaysSinceTested ] = useState( 1 );
	const [ mobileSpeedScore, setMobileSpeedScore ] = useState( 0 );
	const [ desktopSpeedScore, setDesktopSpeedScore ] = useState( 0 );

	const getSpeedScores = () => {
		if ( isSiteOffline ) {
			return;
		}

		setIsLoading( true );

		setTimeout( () => {
			setMobileSpeedScore( 60 );
			setDesktopSpeedScore( 75 );
			setSpeedLetterGrade( getScoreLetter( 60, 75 ) );
			setDaysSinceTested( 0 );
			setIsLoading( false );
		}, 1500 );
	};

	useEffect( () => {
		getSpeedScores();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const getSpeedScoreText = () => {
		switch ( speedLetterGrade ) {
			case 'A':
				return __( 'Your site is fast! But maintaining a high speed isn’t easy.', 'jetpack' );
			case 'B':
				return __( 'You are one step away from making your site blazing fast.', 'jetpack' );
			default:
				return __( 'Your site needs performance improvements!', 'jetpack' );
		}
	};

	const getSinceTestedText = () => {
		switch ( daysSinceTested ) {
			case 0:
				return __( 'Your site was tested today', 'jetpack' );
			case 1:
				return __( 'Your site was tested yesterday', 'jetpack' );
			default:
				return sprintf(
					// translators: %s is the number of days since the site was last tested.
					__( 'Your site was tested %s days ago', 'jetpack' ),
					daysSinceTested
				);
		}
	};

	const getSlowSiteInfoText = () => {
		switch ( speedLetterGrade ) {
			case 'A':
				return {
					top: __(
						'A one-second delay in loading times can reduce your site traffic by 10%.',
						'jetpack'
					),
					bottom: __(
						'Use Boost’s automated acceleration tools to optimize your performance on the go.',
						'jetpack'
					),
				};
			case 'B':
				return {
					top: __(
						'A one-second improvement in loading times can increase your site traffic by 10%.',
						'jetpack'
					),
					bottom: __(
						'Jetpack Boost enhance your site’s performance like top websites, no developer needed.',
						'jetpack'
					),
				};
			default:
				return {
					top: __(
						'You can lose 10% of your visitors for every additional second your site takes to load.',
						'jetpack'
					),
					bottom: __(
						'Make your site blazing fast for free with Boost’s simple dashboard and acceleration tools.',
						'jetpack'
					),
				};
		}
	};

	const hasBoost = isBoostInstalled && isBoostActive;

	// Don't show score bars until we know if they already have boost installed and activated, the site is online, and we have the scores.
	const shouldShowScoreBars = ! hasBoost && ! isSiteOffline && ! isLoading && ! fetchingPluginsData;
	const pluginName = _x(
		'Boost',
		'The Jetpack Boost product name, without the Jetpack prefix',
		'jetpack'
	);

	const getPluginInstallSectionText = () => {
		if ( hasActiveBoostPurchase ) {
			return __( 'We’re automatically re-generating your site’s Critical CSS.', 'jetpack' );
		}

		return createInterpolateElement(
			__(
				'<a>Re-generate your Critical CSS after you make changes on your site</a><Info/>',
				'jetpack'
			),
			{
				a: <a href={ siteAdminUrl + BOOST_PLUGIN_DASH } />,
				Info: <CriticalCssInfoPopover />,
			}
		);
	};

	const getInstallLinkText = () => {
		if ( hasBoost ) {
			return;
		}

		if ( isInstalling ) {
			return __( 'Installing…', 'jetpack' );
		}

		if ( isActivating ) {
			return __( 'Activating…', 'jetpack' );
		}

		if ( isBoostInstalled ) {
			return __( 'Activate Boost to run instant tests', 'jetpack' );
		}

		return __( 'Install Boost to run instant tests', 'jetpack' );
	};

	const activateOrInstallBoost = useCallback( () => {
		if ( hasBoost ) {
			return;
		}

		if ( isBoostInstalled ) {
			setIsActivating( true );
		} else {
			setIsInstalling( true );
		}

		analytics.tracks.recordJetpackClick( {
			target: 'boost_instant_tests_install',
			type: isBoostInstalled ? 'activate' : 'install',
			feature: BOOST_PLUGIN_SLUG,
		} );

		return (
			restApi
				.installPlugin( BOOST_PLUGIN_SLUG, 'active' )
				// take a little break to avoid any race conditions with plugin data being updated
				.then( () => new Promise( resolve => setTimeout( resolve, 2500 ) ) )
				.then( () => {
					return fetchPluginsData();
				} )
				.finally( () => {
					setIsInstalling( false );
					setIsActivating( false );
				} )
		);
	}, [ fetchPluginsData, isBoostInstalled, hasBoost ] );

	return (
		<div className="dash-boost-speed-score">
			{ shouldShowScoreBars ? (
				<>
					<div className="dash-boost-speed-score__summary">
						<div>
							<span className="dash-boost-speed-score__summary-grade">
								{ sprintf(
									// translators: %s is the letter grade of the site's speed performance.
									__( 'Your site’s speed performance score: %s', 'jetpack' ),
									speedLetterGrade
								) }
								<GradeInfoPopover />
							</span>

							<p
								className={ classnames(
									'dash-boost-speed-score__score-text',
									[ 'C', 'D', 'E', 'F' ].includes( speedLetterGrade ) ? 'warning' : ''
								) }
							>
								{ getSpeedScoreText() }
							</p>
						</div>

						<div>
							<p className="dash-boost-speed-score__last-tested">{ getSinceTestedText() }</p>
							<button
								className="dash-boost-speed-score__install-button-link"
								onClick={ activateOrInstallBoost }
								disabled={ isInstalling || isActivating }
							>
								{ getInstallLinkText() }
							</button>
						</div>
					</div>

					<div className="dash-boost-speed-score__score-bars">
						<BoostScoreBar
							score={ mobileSpeedScore }
							active={ true }
							isLoading={ isLoading }
							showPrevScores={ false }
							scoreBarType="mobile"
						/>

						<BoostScoreBar
							score={ desktopSpeedScore }
							active={ true }
							isLoading={ isLoading }
							showPrevScores={ false }
							scoreBarType="desktop"
						/>
					</div>
				</>
			) : (
				<SectionHeader className="dash-boost-speed-score__section-header" label={ pluginName } />
			) }

			<div>
				<PluginInstallSection
					pluginName={ pluginName }
					pluginSlug={ BOOST_PLUGIN_SLUG }
					pluginFiles={ BOOST_PLUGIN_FILES }
					pluginLink={ siteAdminUrl + BOOST_PLUGIN_DASH }
					installOrActivatePrompt={ createInterpolateElement(
						sprintf(
							'<b>%1$s<Info/><br/></b>%2$s',
							getSlowSiteInfoText().top,
							getSlowSiteInfoText().bottom
						),
						{
							br: <br />,
							b: <b />,
							Info: <ConversionLossPopover />,
						}
					) }
					installedPrompt={ getPluginInstallSectionText() }
				/>
			</div>
		</div>
	);
};

DashBoost.propTypes = {
	// Passed props
	siteAdminUrl: PropTypes.string.isRequired,
	// State connected props
	siteConnectionStatus: PropTypes.oneOfType( [ PropTypes.bool, PropTypes.string ] ).isRequired,
	siteUrl: PropTypes.string.isRequired,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	fetchingPluginsData: PropTypes.bool.isRequired,
	isBoostInstalled: PropTypes.bool.isRequired,
	isBoostActive: PropTypes.bool.isRequired,
	hasActiveBoostPurchase: PropTypes.bool.isRequired,
};

export default connect(
	state => ( {
		siteConnectionStatus: getSiteConnectionStatus( state ),
		siteUrl: getSiteRawUrl( state ),
		apiRoot: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
		fetchingPluginsData: isFetchingPluginsData( state ),
		isBoostInstalled: BOOST_PLUGIN_FILES.some( pluginFile =>
			isPluginInstalled( state, pluginFile )
		),
		isBoostActive: BOOST_PLUGIN_FILES.some( pluginFile => isPluginActive( state, pluginFile ) ),
		hasActiveBoostPurchase: getActiveBoostPurchase( state ),
	} ),
	dispatch => ( {
		fetchPluginsData: () => dispatch( dispatchFetchPluginsData() ),
	} )
)( DashBoost );

// Popover components

const GradeInfoPopover = () => {
	const trackInfoClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'boost-grade-info-button',
			feature: BOOST_PLUGIN_SLUG,
		} );
	}, [] );

	return (
		<div className="boost-grade-info">
			<InfoPopover
				onClick={ trackInfoClick }
				screenReaderText={ __( 'Learn more about how this grade is calculated', 'jetpack' ) }
			>
				<p className="boost-grade-info__grades-description">
					{ __(
						'Your Overall Score is a summary of your website performance across both mobile and desktop devices. It gives a general idea of your sites’ overall performance.',
						'jetpack'
					) }
				</p>
				<div className="boost-grade-info__grades-table">
					<table>
						<tbody>
							<tr>
								<th>A</th>
								<td>90+</td>
							</tr>
							<tr>
								<th>B</th>
								<td>75-90</td>
							</tr>
							<tr>
								<th>C</th>
								<td>50-75</td>
							</tr>
						</tbody>
					</table>
					<table>
						<tbody>
							<tr>
								<th>D</th>
								<td>35-50</td>
							</tr>
							<tr>
								<th>E</th>
								<td>25-35</td>
							</tr>
							<tr>
								<th>F</th>
								<td>0-25</td>
							</tr>
						</tbody>
					</table>
				</div>
			</InfoPopover>
		</div>
	);
};

const ConversionLossPopover = () => {
	const trackInfoClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'boost-conversion-loss-info-button',
			feature: BOOST_PLUGIN_SLUG,
		} );
	}, [] );

	const trackSourceClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'boost-conversion-loss-info-source',
			feature: BOOST_PLUGIN_SLUG,
		} );
	}, [] );

	return (
		<div className="boost-conversion-loss-info">
			<InfoPopover
				onClick={ trackInfoClick }
				screenReaderText={ __( 'Learn more about how slow sites lose visitors', 'jetpack' ) }
			>
				<p className="boost-conversion-loss-info__source">
					{ __( 'Source: ', 'jetpack' ) }
					<ExternalLink
						href="https://web.dev/why-speed-matters/"
						target="_blank"
						rel="noopener noreferrer"
						onClick={ trackSourceClick }
					>
						web.dev
					</ExternalLink>
				</p>
			</InfoPopover>
		</div>
	);
};

const CriticalCssInfoPopover = () => {
	const criticalCssUrl = getRedirectUrl( 'jetpack-boost-critical-css' );

	const trackInfoClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'boost-critical-css-info-button',
			feature: BOOST_PLUGIN_SLUG,
		} );
	}, [] );

	const trackCriticalCSSLinkClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'boost-critical-css-info-link',
			feature: BOOST_PLUGIN_SLUG,
		} );
	}, [] );

	return (
		<div className="boost-critical-css-info">
			<InfoPopover
				onClick={ trackInfoClick }
				screenReaderText={ __( 'Learn more about how critical CSS works', 'jetpack' ) }
			>
				<h3 className="boost-critical-css-info__title">
					{ __( 'Regenerate Critical CSS', 'jetpack' ) }
				</h3>
				<p>
					{ createInterpolateElement(
						__(
							'You should regenerate <ExternalLink>Critical CSS</ExternalLink> to optimize speed whenever your site’s HTML or CSS structure changes after:',
							'jetpack'
						),
						{
							ExternalLink: (
								<ExternalLink
									onClick={ trackCriticalCSSLinkClick }
									href={ criticalCssUrl }
									target="_blank"
									rel="noopener noreferrer"
								/>
							),
						}
					) }
				</p>
				<ul className="boost-critical-css-info__list">
					<li>{ __( 'Making theme changes.', 'jetpack' ) }</li>
					<li>{ __( 'Writing a new post/page', 'jetpack' ) }</li>
					<li>{ __( 'Editing a post/page', 'jetpack' ) }</li>
					<li>
						{ __(
							'Activating, Deactivating, or updating plugins that impact your site layout.',
							'jetpack'
						) }
					</li>
					<li>
						{ __(
							'Upgrading your WordPress version if the new release includes core CSS changes',
							'jetpack'
						) }
					</li>
				</ul>
				<p className="boost-critical-css-info__bottom-text">
					{ __(
						'Being on top of this can be tedious and time-consuming. Boost’s cloud service can automatically detect when your site needs a new Critical CSS and generate it, improving site performance and SEO without requiring manual monitoring.',
						'jetpack'
					) }
				</p>
			</InfoPopover>
		</div>
	);
};
