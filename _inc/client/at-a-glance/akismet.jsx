/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { numberFormat, translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import DashItem from 'components/dash-item';
import QueryAkismetData from 'components/data/query-akismet-data';
import { getAkismetData } from 'state/at-a-glance';
import { getSitePlan } from 'state/site';
import { isDevMode } from 'state/connection';

class DashAkismet extends Component {

	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		siteAdminUrl: PropTypes.string.isRequired,

		// Connected props
		akismetData: PropTypes.oneOfType( [
			PropTypes.string,
			PropTypes.object
		] ).isRequired,
		isDevMode: PropTypes.bool.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		siteAdminUrl: '',
		akismetData: 'N/A',
		isDevMode: '',
	};

	getContent() {
		const akismetData = this.props.akismetData;
		const labelName = __( 'Spam Protection' );

		const support = {
			text: __( 'Akismet checks your comments and contact form submissions against our global database of spam.' ),
			link: 'https://akismet.com/',
			privacyLink: 'https://automattic.com/privacy/',
		};

		if ( akismetData === 'N/A' ) {
			return (
				<DashItem
					label={ labelName }
					module="akismet"
					support={ support }
					pro={ true }
				>
					<p className="jp-dash-item__description">
						{ __( 'Loading…' ) }
					</p>
				</DashItem>
			);
		}

		const hasSitePlan = false !== this.props.sitePlan;

		if ( akismetData === 'not_installed' ) {
			return (
				<DashItem
					label={ labelName }
					module="akismet"
					support={ support }
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
					support={ support }
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
					support={ support }
					className="jp-dash-item__is-inactive"
					status="is-warning"
					statusText={ __( 'Invalid key' ) }
					pro={ true }
				>
					<p className="jp-dash-item__description">
						{
							__( 'Whoops! Your Akismet key is missing or invalid. {{akismetSettings}}Go to Akismet settings to fix{{/akismetSettings}}.', {
								components: {
									akismetSettings: <a href={ `${ this.props.siteAdminUrl }admin.php?page=akismet-key-config` } />
								}
							} )
						}
					</p>
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
				<h2 className="jp-dash-item__count">{ numberFormat( akismetData.all.spam ) }</h2>
				<p className="jp-dash-item__description">
					{
						__( 'Spam comments blocked.', {
							context: 'Example: "412 Spam comments blocked"'
						} )
					}
				</p>
			</DashItem>,
			! this.props.isDevMode && (
				<Card
					key="moderate-comments"
					className="jp-dash-item__manage-in-wpcom"
					compact
					href={ `https://wordpress.com/comments/all/${ this.props.siteRawUrl }` }
				>
					{ __( 'Moderate comments' ) }
				</Card>
			)
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
	state => ( {
		akismetData: getAkismetData( state ),
		sitePlan: getSitePlan( state ),
		isDevMode: isDevMode( state ),
	} )
)( DashAkismet );
