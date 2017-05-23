/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { numberFormat, translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import QueryAkismetData from 'components/data/query-akismet-data';
import { getAkismetData } from 'state/at-a-glance';
import { getSitePlan } from 'state/site';

class DashAkismet extends Component {
	getContent() {
		const akismetData = this.props.akismetData,
			akismetSettingsUrl = this.props.siteAdminUrl + 'admin.php?page=akismet-key-config',
			labelName = __( 'Spam Protection' ),
			hasSitePlan = false !== this.props.sitePlan;

		if ( akismetData === 'N/A' ) {
			return (
				<DashItem
					label={ labelName }
					module="akismet"
					pro={ true }
				>
					<p className="jp-dash-item__description">
						{ __( 'Loading…' ) }
					</p>
				</DashItem>
			);
		}

		if ( akismetData === 'not_installed' ) {
			return (
				<DashItem
					label={ labelName }
					module="akismet"
					className="jp-dash-item__is-inactive"
					status={ hasSitePlan ? 'pro-uninstalled' : 'no-pro-uninstalled-or-inactive' }
					pro={ true }
				>
					<p className="jp-dash-item__description">
						{
							__( 'For state-of-the-art spam defense, please {{a}}install Akismet{{/a}}.', {
								components: {
									a: <a href={ 'https://wordpress.com/plugins/akismet/' + this.props.siteRawUrl } target="_blank" rel="noopener noreferrer" />
								}
							} )
						}
					</p>
				</DashItem>
			);
		}

		if ( akismetData === 'not_active' ) {
			return (
				<DashItem
					label={ labelName }
					module="akismet"
					status={ hasSitePlan ? 'pro-inactive' : 'no-pro-uninstalled-or-inactive' }
					className="jp-dash-item__is-inactive"
					pro={ true }
				>
					<p className="jp-dash-item__description">
						{
							__( 'For state-of-the-art spam defense, please {{a}}activate Akismet{{/a}}.', {
								components: {
									a: <a href={ 'https://wordpress.com/plugins/akismet/' + this.props.siteRawUrl } target="_blank" rel="noopener noreferrer" />
								}
							} )
						}
					</p>
				</DashItem>
			);
		}

		if ( akismetData === 'invalid_key' ) {
			return (
				<DashItem
					label={ labelName }
					module="akismet"
					className="jp-dash-item__is-inactive"
					status="is-warning"
					statusText={ __( 'Invalid key' ) }
					pro={ true }
				>
					<p className="jp-dash-item__description">
						{
							__( 'Whoops! Your Akismet key is missing or invalid. {{akismetSettings}}Go to Akismet settings to fix{{/akismetSettings}}.', {
								components: {
									akismetSettings: <a href={ akismetSettingsUrl } />
								}
							} )
						}
					</p>
				</DashItem>
			);
		}

		return (
			<DashItem
				label={ labelName }
				module="akismet"
				status="is-working"
				pro={ true }
			>
				<h2 className="jp-dash-item__count">{ numberFormat( akismetData.all.spam ) }</h2>
				<p className="jp-dash-item__description">
					{
						__( 'Spam comments blocked.', {
							context: 'Example: "412 Spam comments blocked"'
						} )
					}
				</p>
			</DashItem>
		);
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

DashAkismet.propTypes = {
	siteRawUrl: React.PropTypes.string.isRequired,
	siteAdminUrl: React.PropTypes.string.isRequired
};

export default connect(
	( state ) => {
		return {
			akismetData: getAkismetData( state ),
			sitePlan: getSitePlan( state )
		};
	}
)( DashAkismet );
