import restApi from '@automattic/jetpack-api';
import { formatNumber } from '@automattic/number-formatters';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import QueryAkismetData from 'components/data/query-akismet-data';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import JetpackBanner from 'components/jetpack-banner';
import analytics from 'lib/analytics';
import { getJetpackProductUpsellByFeature, FEATURE_SPAM_AKISMET_PLUS } from 'lib/plans/constants';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import { getAkismetData } from 'state/at-a-glance';
import { isOfflineMode, connectUser } from 'state/connection';
import { getApiNonce, isWoASite } from 'state/initial-state';
import { siteHasFeature } from 'state/site';

class DashAkismet extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		siteAdminUrl: PropTypes.string.isRequired,
		trackUpgradeButtonView: PropTypes.func,

		// Connected props
		akismetData: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object, PropTypes.number ] )
			.isRequired,
		isOfflineMode: PropTypes.bool.isRequired,
		upgradeUrl: PropTypes.string.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		siteAdminUrl: '',
		akismetData: 'N/A',
		isOfflineMode: '',
		trackUpgradeButtonView: noop,
	};

	trackActivateClick() {
		analytics.tracks.recordJetpackClick( {
			type: 'activate-link',
			target: 'at-a-glance',
			feature: 'anti-spam',
		} );
	}

	onActivateClick = () => {
		this.trackActivateClick();

		this.props.createNotice( 'is-info', __( 'Activating Akismet…', 'jetpack' ), {
			id: 'activating-akismet',
		} );

		restApi
			.activateAkismet()
			.then( () => {
				this.props.removeNotice( 'activating-akismet' );
				window.location.href = this.props.siteAdminUrl + 'admin.php?page=akismet-key-config';
			} )
			.catch( () => {
				this.props.removeNotice( 'activating-akismet' );
				this.props.createNotice( 'is-error', __( 'Could not activate Akismet.', 'jetpack' ), {
					id: 'activate-akismet-failure',
				} );
			} );

		return false;
	};

	trackModerateClick() {
		analytics.tracks.recordJetpackClick( {
			type: 'moderate-link',
			target: 'at-a-glance',
			feature: 'anti-spam',
		} );
	}

	onModerateClick = () => {
		this.trackModerateClick();
	};

	getContent() {
		const { akismetData, siteAdminUrl } = this.props;
		const labelName = __( 'Akismet Anti-spam', 'jetpack' );

		const support = {
			text: __(
				'Comments and contact form submissions are checked against our global database of spam.',
				'jetpack'
			),
			// Hide the action link from WoA sites because it promotes purchase of Jetpack product
			link: this.props.isWoASite ? null : 'https://akismet.com/features',
			privacyLink: 'https://automattic.com/privacy/',
		};

		const getAkismetUpgradeBanner = () => {
			let description;

			if ( 'not_active' === akismetData ) {
				description = createInterpolateElement(
					__( 'Already have an API key? <Button>Activate Akismet Anti-spam</Button>.', 'jetpack' ),
					{
						Button: <Button className="jp-link-button" onClick={ this.onActivateClick } />,
					}
				);
			} else if ( 'invalid_key' === akismetData ) {
				description = createInterpolateElement(
					__( 'Already have an API key? <a>Get started</a>.', 'jetpack' ),
					{
						a: <a href={ siteAdminUrl + 'admin.php?page=akismet-key-config' } />,
					}
				);
			}

			return (
				<JetpackBanner
					callToAction={ _x( 'Upgrade', 'Call to action to buy a new plan', 'jetpack' ) }
					title={ __( 'Automatically clear spam from comments and forms.', 'jetpack' ) }
					description={ description }
					disableHref="false"
					href={ this.props.upgradeUrl }
					eventFeature="akismet"
					path="dashboard"
					plan={ getJetpackProductUpsellByFeature( FEATURE_SPAM_AKISMET_PLUS ) }
					trackBannerDisplay={ this.props.trackUpgradeButtonView }
				/>
			);
		};

		const getBanner = () => {
			return getAkismetUpgradeBanner();
		};

		const getAkismetCounter = () => {
			if ( 0 !== this.props.akismetData ) {
				return (
					<>
						<h2 className="jp-dash-item__count">{ formatNumber( this.props.akismetData ) }</h2>
						<p className="jp-dash-item__description">
							{ _x( 'Spam comments blocked.', 'Example: "412 Spam comments blocked"', 'jetpack' ) }
						</p>
					</>
				);
			}

			return (
				<div className="jp-dash-item__recently-activated">
					<p className="jp-dash-item__description">
						{ __(
							'Akismet is now monitoring all comments on your site. Data will display here soon!',
							'jetpack'
						) }
					</p>
				</div>
			);
		};

		// If we don't have data from Akismet yet, show a loading state.
		if ( 'N/A' === akismetData ) {
			return (
				<DashItem label={ labelName } module="akismet" support={ support } pro={ true }>
					<p className="jp-dash-item__description">{ __( 'Loading…', 'jetpack' ) }</p>
				</DashItem>
			);
		}

		// If Akismet is not installed or not configured yet, show a banner to install it.
		if ( [ 'not_installed', 'not_active', 'invalid_key' ].includes( akismetData ) ) {
			const commonProps = {
				label: labelName,
				module: 'akismet',
				support: support,
				className: 'jp-dash-item__is-inactive',
				pro: true,
			};

			// Akismet is not installed nor activated.
			if ( ! this.props.hasAntiSpam && ! this.props.hasAkismet ) {
				// In Offline Mode, we can't prompt to connect to WordPress.com
				// the site will not be able to communicate with Akismet servers,
				// and is very likely not to get any comments.
				// Akismet will not be useful for them.
				if ( this.props.isOfflineMode ) {
					return (
						<DashItem { ...commonProps }>
							<p className="jp-dash-item__description">
								{ __( 'Unavailable in Offline Mode.', 'jetpack' ) }
							</p>
						</DashItem>
					);
				}

				return <DashItem { ...commonProps } overrideContent={ getBanner() } />;
			}

			// The plugin is installed and activated, but not configured yet.
			return (
				<DashItem { ...commonProps }>
					{ __(
						"Your Jetpack plan provides anti-spam protection through Akismet. Click 'set up' to enable it on your site.",
						'jetpack'
					) }
				</DashItem>
			);
		}

		return [
			<DashItem
				key="comment-moderation"
				label={ labelName }
				module="akismet"
				support={ support }
				status="is-working"
				pro={ true }
			>
				{ getAkismetCounter( akismetData ) }
			</DashItem>,
			! this.props.isOfflineMode && (
				<Card
					key="moderate-comments"
					className="jp-dash-item__manage-in-wpcom"
					compact
					href={ `${ this.props.siteAdminUrl }edit-comments.php` }
					onClick={ this.onModerateClick }
				>
					{ __( 'Moderate comments', 'jetpack' ) }
				</Card>
			),
		];
	}

	render() {
		return (
			<div className="jp-dash-item__interior">
				<QueryAkismetData />
				{ this.getContent() }
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			akismetData: getAkismetData( state ),
			isWoASite: isWoASite( state ),
			isOfflineMode: isOfflineMode( state ),
			upgradeUrl: getProductDescriptionUrl( state, 'akismet' ),
			nonce: getApiNonce( state ),
			hasAntiSpam: siteHasFeature( state, 'antispam' ),
			hasAkismet: siteHasFeature( state, 'akismet' ),
		};
	},
	dispatch => ( {
		createNotice,
		removeNotice,
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashAkismet );
