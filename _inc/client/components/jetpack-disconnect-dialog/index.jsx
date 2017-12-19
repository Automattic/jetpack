/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import Modal from 'components/modal';
import { getPlanClass } from 'lib/plans/constants';
import noop from 'lodash/noop';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { getSitePlan } from 'state/site';
import {
	disconnectSite,
	isDisconnectingSite,
} from 'state/connection';
import { getSiteRawUrl } from 'state/initial-state';

export const JetpackDisconnectDialog = React.createClass( {
	propTypes: {
		show: PropTypes.bool,
		toggleModal: PropTypes.func,
		disconnectSite: PropTypes.func
	},

	getDefaultProps() {
		return {
			show: false,
			toggleModal: noop,
			disconnectSite: noop
		};
	},

	getPlanFeatures() {
		switch ( getPlanClass( this.props.sitePlan.product_slug ) ) {
			case 'is-personal-plan':
				return [
					{
						text: __( 'Daily, automated backups (unlimited storage)' ),
						icon: 'history'
					},
					{
						text: __( 'Priority support' ),
						icon: 'chat'
					},
					{
						text: __( 'Spam filtering' ),
						icon: 'spam'
					}
				];

			case 'is-premium-plan':
				return [
					{
						text: __( 'Daily, automated backups (unlimited storage)' ),
						icon: 'history'
					},
					{
						text: __( 'Daily, automated malware scanning' ),
						icon: 'spam'
					},
					{
						text: __( 'Priority support' ),
						icon: 'chat'
					},
					{
						text: __( '13Gb of high-speed video hosting' ),
						icon: 'video'
					}
				];

			case 'is-business-plan':
				return [
					{
						text: __( 'Daily, automated backups (unlimited storage)' ),
						icon: 'history'
					},
					{
						text: __( 'Daily, automated malware scanning with automated resolution' ),
						icon: 'spam'
					},
					{
						text: __( 'Priority support' ),
						icon: 'chat'
					},
					{
						text: __( 'Unlimited high-speed video hosting' ),
						icon: 'video'
					},
					{
						text: __( 'SEO preview tools' ),
						icon: 'globe'
					}
				];
			default:
				return [
					{
						text: __( 'Site stats, related content, and sharing tools' ),
						icon: 'stats-alt'
					},
					{
						text: __( 'Brute force attack protection and uptime monitoring' ),
						icon: 'lock'
					},
					{
						text: __( 'Unlimited, high-speed image hosting' ),
						icon: 'image'
					}
				];
		}
	},

	closeModal() {
		analytics.tracks.recordJetpackClick( {
			target: 'manage_site_connection',
			button: 'stay-connected'
		} );

		this.props.toggleModal();
	},

	disconnectSiteTrack() {
		analytics.tracks.recordJetpackClick( {
			target: 'manage_site_connection',
			button: 'disconnect-site'
		} );

		this.props.disconnectSite();
	},

	render() {
		return this.props.show && (
			<Modal
				className="jp-connection-settings__modal"
				onRequestClose={ this.props.toggleModal }
				>
				<Card className="jp-connection-settings__modal-body">
					<h2>
						{
							__( 'Disconnect Jetpack' )
						}
					</h2>
					<h4>
						{
							__( 'By disconnecting %(siteName)s from WordPress.com you will no longer have access to the following:', {
								args: {
									siteName: this.props.siteRawUrl.replace( '::', '/' )
								}
							} )
						}
					</h4>
					<ul>
						{
							this.getPlanFeatures().map( item => (
								<li key={ `feature_${ item.icon }` }>
									<Gridicon icon={ item.icon } size={ 18 } />
									{ item.text }
								</li>
							) )
						}
					</ul>
					<div className="jp-connection-settings__modal-actions">
						<Button
							className="jp-connection-settings__modal-cancel"
							onClick={ this.closeModal }>
							{
								__( 'Stay connected', { context: 'A caption for a button to cancel disconnection.' } )
							}
						</Button>
						<Button
							onClick={ this.disconnectSiteTrack }
							scary
							primary>
							{
								__( 'Disconnect', { context: 'A caption for a button to disconnect.' } )
							}
						</Button>
					</div>
					<p className="jp-connection-settings__modal-more">
						<a href="https://jetpack.com/features/">
							{
								__( 'Read more about Jetpack benefits' )
							}
						</a>
					</p>
				</Card>
			</Modal>
		);
	}
} );

export default connect(
	state => {
		return {
			siteRawUrl: getSiteRawUrl( state ),
			isDisconnecting: isDisconnectingSite( state ),
			sitePlan: getSitePlan( state )
		};
	},
	( dispatch ) => {
		return {
			disconnectSite: () => {
				return dispatch( disconnectSite() );
			}
		};
	}
)( JetpackDisconnectDialog );
