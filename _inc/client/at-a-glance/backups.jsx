/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';
import { get, isEmpty, noop } from 'lodash';
import { PLAN_JETPACK_PREMIUM } from 'lib/plans/constants';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import JetpackBanner from 'components/jetpack-banner';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import { getSitePlan } from 'state/site';
import { isPluginInstalled } from 'state/site/plugins';
import { getVaultPressData } from 'state/at-a-glance';
import { isDevMode } from 'state/connection';
import { getUpgradeUrl, showBackups } from 'state/initial-state';

/**
 * Displays a card for Backups based on the props given.
 *
 * @param   {object} props Settings to render the card.
 * @returns {object}       Backups card
 */
const renderCard = props => (
	<DashItem
		label={ __( 'Backup' ) }
		module={ props.feature || 'backups' }
		support={ {
			text: __(
				'Jetpack Backups allow you to easily restore or download a backup from a specific moment.'
			),
			link: 'https://jetpack.com/support/backup/',
		} }
		className={ props.className }
		status={ props.status }
		pro={ true }
		overrideContent={ props.overrideContent }
	>
		<p className="jp-dash-item__description">{ props.content }</p>
	</DashItem>
);

class DashBackups extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		getOptionValue: PropTypes.func.isRequired,
		rewindStatus: PropTypes.string.isRequired,

		// Connected props
		vaultPressData: PropTypes.any.isRequired,
		sitePlan: PropTypes.object.isRequired,
		isDevMode: PropTypes.bool.isRequired,
		isVaultPressInstalled: PropTypes.bool.isRequired,
		upgradeUrl: PropTypes.string.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		getOptionValue: noop,
		vaultPressData: '',
		sitePlan: '',
		isDevMode: false,
		isVaultPressInstalled: false,
		rewindStatus: '',
	};

	getVPContent() {
		const {
			sitePlan,
			isVaultPressInstalled,
			getOptionValue,
			siteRawUrl,
			vaultPressData,
		} = this.props;

		if ( getOptionValue( 'vaultpress' ) && 'success' === get( vaultPressData, 'code', '' ) ) {
			return renderCard( {
				className: 'jp-dash-item__is-active',
				status: 'is-working',
				content: (
					<span>
						{ get( vaultPressData, 'message', '' ) }
						&nbsp;
						{ __( '{{a}}View backup details{{/a}}.', {
							components: {
								a: (
									<a
										href="https://dashboard.vaultpress.com"
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
							},
						} ) }
					</span>
				),
			} );
		}

		if ( ! isEmpty( sitePlan ) ) {
			// If site has a paid plan
			if ( 'jetpack_free' !== get( sitePlan, 'product_slug', 'jetpack_free' ) ) {
				return renderCard( {
					className: 'jp-dash-item__is-inactive',
					status: isVaultPressInstalled ? 'pro-inactive' : 'pro-uninstalled',
					content: __(
						'To automatically back up your entire site, please {{a}}install and activate{{/a}} VaultPress.',
						{
							components: {
								a: (
									<a
										href={ `https://wordpress.com/plugins/setup/${ siteRawUrl }?only=backups` }
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
							},
						}
					),
				} );
			}

			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'no-pro-uninstalled-or-inactive',
				overrideContent: (
					<JetpackBanner
						callToAction={ __( 'Upgrade' ) }
						title={ __(
							'Never worry about losing your site – automatic backups keep your content safe.'
						) }
						disableHref="false"
						href={ this.props.upgradeUrl }
						eventFeature="backups"
						path="dashboard"
						plan={ PLAN_JETPACK_PREMIUM }
						icon="history"
					/>
				),
			} );
		}

		return renderCard( {
			className: '',
			status: '',
			content: __( 'Loading…' ),
		} );
	}

	getRewindContent() {
		const { rewindStatus, siteRawUrl } = this.props;
		const buildAction = ( url, message ) => (
			<Card compact key="manage-backups" className="jp-dash-item__manage-in-wpcom" href={ url }>
				{ message }
			</Card>
		);
		const buildCard = message =>
			renderCard( {
				className: 'jp-dash-item__is-active',
				status: 'is-working',
				feature: 'rewind',
				content: message,
			} );

		switch ( rewindStatus ) {
			case 'provisioning':
				return (
					<React.Fragment>
						{ buildCard( __( "We are configuring your site's backups." ) ) }
					</React.Fragment>
				);
			case 'awaiting_credentials':
				return (
					<React.Fragment>
						{ buildCard(
							__( "You need to enter your server's credentials to finish the setup." )
						) }
						{ buildAction(
							`https://wordpress.com/settings/security/${ siteRawUrl }`,
							__( 'Enter credentials' )
						) }
					</React.Fragment>
				);
			case 'active':
				return (
					<React.Fragment>
						{ buildCard( __( 'We are backing up your site in real-time.' ) ) }
						{ buildAction(
							`https://wordpress.com/activity-log/${ siteRawUrl }?group=rewind`,
							__( "View your site's backups" )
						) }
					</React.Fragment>
				);
		}

		return false;
	}

	render() {
		if ( ! this.props.showBackups ) {
			return null;
		}

		if ( this.props.isDevMode ) {
			return (
				<div className="jp-dash-item__interior">
					{ renderCard( {
						className: 'jp-dash-item__is-inactive',
						status: 'no-pro-uninstalled-or-inactive',
						content: __( 'Unavailable in Dev Mode.' ),
					} ) }
				</div>
			);
		}

		return (
			<div>
				<QueryVaultPressData />
				{ 'unavailable' === this.props.rewindStatus ? (
					this.getVPContent()
				) : (
					<div className="jp-dash-item">{ this.getRewindContent() }</div>
				) }
			</div>
		);
	}
}

export default connect( state => {
	return {
		vaultPressData: getVaultPressData( state ),
		sitePlan: getSitePlan( state ),
		isDevMode: isDevMode( state ),
		isVaultPressInstalled: isPluginInstalled( state, 'vaultpress/vaultpress.php' ),
		showBackups: showBackups( state ),
		upgradeUrl: getUpgradeUrl( state, 'aag-backups' ),
	};
} )( DashBackups );
