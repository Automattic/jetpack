/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';
import noop from 'lodash/noop';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

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
		module={ props.feature || 'backups' }
		className={ props.className }
		status={ props.status }
		pro={ true }
	>
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
								a: <a href="https://dashboard.vaultpress.com" target="_blank" rel="noopener noreferrer" />
							}
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
					content: __( 'To automatically back up your entire site, please {{a}}install and activate{{/a}} VaultPress.', {
						components: {
							a: <a href={ `https://wordpress.com/plugins/setup/${ siteRawUrl }?only=backups` } target="_blank" rel="noopener noreferrer" />
						}
					} )
				} );
			}

			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'no-pro-uninstalled-or-inactive',
				content: __( 'To automatically back up your entire site, please {{a}}upgrade your account{{/a}}.', {
					components: {
						a:
							<a href={ `https://jetpack.com/redirect/?source=aag-backups&site=${ siteRawUrl }` } target="_blank" rel="noopener noreferrer" />
					}
				} ),
			} );
		}

		return renderCard( {
			className: '',
			status: '',
			content: __( 'Loading…' )
		} );
	}

	render() {
		if ( this.props.isDevMode ) {
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
						? renderCard( {
							className: 'jp-dash-item__is-active',
							status: 'is-working',
							content: __( 'Your site is being backed up in real-time.' ),
							feature: 'rewind',
						} )
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
			isDevMode: isDevMode( state ),
			isVaultPressInstalled: isPluginInstalled( state, 'vaultpress/vaultpress.php' )
		};
	}
)( DashBackups );
