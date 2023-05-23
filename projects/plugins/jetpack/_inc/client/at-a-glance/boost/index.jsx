import {
	getScoreLetter,
	// requestSpeedScores,
	// didScoresChange,
} from '@automattic/jetpack-boost-score-api';
import { BoostScoreBar } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import PluginInstallSection from 'components/plugin-install-section';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { getSiteConnectionStatus } from 'state/connection';
import { getApiRootUrl, getApiNonce, getSiteRawUrl } from 'state/initial-state';
import { isFetchingPluginsData, isPluginInstalled, isPluginActive } from 'state/site/plugins';
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
	fetchingPluginsData,
	isBoostInstalled,
	isBoostActive,
} ) => {
	const isSiteOffline = siteConnectionStatus === 'offline';

	const [ isLoading, setIsLoading ] = useState( true );
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

	if ( ( isBoostInstalled && isBoostActive ) || fetchingPluginsData ) {
		return null;
	}

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

	return (
		<div className="dash-boost-speed-score">
			<div className="dash-boost-speed-score__summary">
				<div>
					{ isLoading ? (
						<>
							<span className="dash-boost-speed-score__summary-grade">
								{ sprintf(
									// translators: %s is the letter grade of the site's speed performance.
									__( 'Your site’s speed performance score: %s', 'jetpack' ),
									speedLetterGrade
								) }
							</span>

							<p
								className={ classnames(
									'dash-boost-speed-score__score-text',
									[ 'C', 'D', 'F' ].includes( speedLetterGrade ) ? 'warning' : ''
								) }
							>
								{ getSpeedScoreText() }
							</p>
						</>
					) : (
						<span className="dash-boost-speed-score__summary-grade">
							{ __( 'Loading…', 'jetpack' ) }
						</span>
					) }
				</div>

				<div>
					<p className="dash-boost-speed-score__last-tested">{ getSinceTestedText() }</p>
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

			<div>
				<PluginInstallSection
					pluginName={ _x(
						'Boost',
						'The Jetpack Boost product name, without the Jetpack prefix',
						'jetpack'
					) }
					pluginSlug={ BOOST_PLUGIN_SLUG }
					pluginFiles={ BOOST_PLUGIN_FILES }
					pluginLink={ siteAdminUrl + BOOST_PLUGIN_DASH }
					installOrActivatePrompt={ createInterpolateElement(
						sprintf(
							'<b>%1$s</b><br />%2$s',
							getSlowSiteInfoText().top,
							getSlowSiteInfoText().bottom
						),
						{
							br: <br />,
							b: <b />,
						}
					) }
				/>
			</div>
		</div>
	);
};

DashBoost.propTypes = {
	// Passed props
	siteAdminUrl: PropTypes.string.isRequired,
	// State connected props
	siteConnectionStatus: PropTypes.string.isRequired,
	siteUrl: PropTypes.string.isRequired,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	fetchingPluginsData: PropTypes.bool.isRequired,
	isBoostInstalled: PropTypes.bool.isRequired,
	isBoostActive: PropTypes.bool.isRequired,
};

export default connect( state => ( {
	siteConnectionStatus: getSiteConnectionStatus( state ),
	siteUrl: getSiteRawUrl( state ),
	apiRoot: getApiRootUrl( state ),
	apiNonce: getApiNonce( state ),
	fetchingPluginsData: isFetchingPluginsData( state ),
	isBoostInstalled: BOOST_PLUGIN_FILES.some( pluginFile => isPluginInstalled( state, pluginFile ) ),
	isBoostActive: BOOST_PLUGIN_FILES.some( pluginFile => isPluginActive( state, pluginFile ) ),
} ) )( DashBoost );
