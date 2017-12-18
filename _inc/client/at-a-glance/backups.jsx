/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';
import { noop } from 'lodash/noop';

/**
 * Internal dependencies
 */
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import { getSitePlan } from 'state/site';
import { isPluginInstalled } from 'state/site/plugins';
import { getVaultPressData } from 'state/at-a-glance';
import { isDevMode } from 'state/connection';

/**
 * Displays a card for Backups based on the props given.
 *
 * @param   {object} props Settings to render the card.
 * @returns {object}       Backups card
 */
const renderCard = ( props ) => (
	<DashItem
		label={ __( 'Backups' ) }
		module="backups"
		className={ props.className }
		status={ props.status }
		pro={ true } >
		<p className="jp-dash-item__description">
			{ props.content }
		</p>
	</DashItem>
);

class DashBackups extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		getOptionValue: PropTypes.func.isRequired,
		isRewindActive: PropTypes.bool.isRequired,

		// Connected props
		vaultPressData: PropTypes.any.isRequired,
		sitePlan: PropTypes.object.isRequired,
		isDevMode: PropTypes.bool.isRequired,
		isVaultPressInstalled: PropTypes.bool.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		getOptionValue: noop,
		isRewindActive: false,
		vaultPressData: '',
		sitePlan: '',
		isDevMode: false,
		isVaultPressInstalled: false,
	};

	getVPContent() {
		const {
			sitePlan,
			isVaultPressInstalled,
			getOptionValue,
			siteRawUrl,
		} = this.props;
		const hasSitePlan = false !== sitePlan && 'jetpack_free' !== sitePlan.product_slug;
		const inactiveOrUninstalled = isVaultPressInstalled ? 'pro-inactive' : 'pro-uninstalled';

		if ( getOptionValue( 'vaultpress' ) ) {
			const vpData = this.props.vaultPressData;

			if ( vpData === 'N/A' ) {
				return renderCard( {
					className: '',
					status: '',
					content: __( 'Loading…' )
				} );
			}

			if ( vpData.code === 'success' ) {
				return renderCard( {
					className: 'jp-dash-item__is-active',
					status: 'is-working',
					content: (
						<span>
							{ vpData.message }
							&nbsp;
							{ __( '{{a}}View backup details{{/a}}.', {
								components: {
									a: <a href="https://dashboard.vaultpress.com" target="_blank" rel="noopener noreferrer" />
								}
							} ) }
						</span>
					),
				} );
			}
		}

		return renderCard( {
			className: 'jp-dash-item__is-inactive',
			status: hasSitePlan
				? inactiveOrUninstalled
				: 'no-pro-uninstalled-or-inactive',
			content: hasSitePlan
				? __( 'To automatically back up your entire site, please {{a}}install and activate{{/a}} VaultPress.', {
					components: {
						a: <a href="https://wordpress.com/plugins/vaultpress" target="_blank" rel="noopener noreferrer" />
					}
				} )
				: __( 'To automatically back up your entire site, please {{a}}upgrade your account{{/a}}.', {
					components: {
						a:
							<a href={ `https://jetpack.com/redirect/?source=aag-backups&site=${ siteRawUrl }` } target="_blank" rel="noopener noreferrer" />
					}
				} ),
		} );
	}

	render() {
		if ( this.props.inDevMode ) {
			return (
				<div className="jp-dash-item__interior">
					{
						renderCard( {
							className: 'jp-dash-item__is-inactive',
							status: 'no-pro-uninstalled-or-inactive',
							content: __( 'Unavailable in Dev Mode.' ),
						} )
					}
				</div>
			);
		}

		return (
			<div className="jp-dash-item__interior">
				<QueryVaultPressData />
				{
					this.props.isRewindActive
						? (
							<div className="jp-dash-item__interior">
								{
									renderCard( {
										className: 'jp-dash-item__is-active',
										status: 'is-working',
										content: __( 'Your site is being backed up in real-time.' ),
									} )
								}
							</div>
						)
						: this.getVPContent()
				}
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			vaultPressData: getVaultPressData( state ),
			sitePlan: getSitePlan( state ),
			inDevMode: isDevMode( state ),
			isVaultPressInstalled: isPluginInstalled( state, 'vaultpress/vaultpress.php' )
		};
	}
)( DashBackups );
