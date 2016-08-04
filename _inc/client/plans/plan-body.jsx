/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants';
import {
	fetchPluginsData,
	isFetchingPluginsData,
	isPluginActive,
	isPluginInstalled
} from 'state/site/plugins';
import QuerySitePlugins from 'components/data/query-site-plugins';

const PlanBody = React.createClass( {
	render() {
		let planCard = '';
		switch ( this.props.plan ) {
			case 'jetpack_premium':
			case 'jetpack_premium_monthly':
			case 'jetpack_business':
			case 'jetpack_business_monthly':
				let needMore = '';
				if ( [ 'jetpack_premium', 'jetpack_premium_monthly' ].includes( this.props.plan ) ) {
					needMore = (
						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title">{ __( 'Need more?' ) }</h3>
							<p>{ __( 'Jetpack Professional offers more features.' ) }</p>
							<p>
								<Button href={ 'https://wordpress.com/plans/compare/' + this.props.siteRawUrl }>
									{ __( 'Compare Plans' ) }
								</Button>
								<Button href={ 'https://wordpress.com/plans/' + this.props.siteRawUrl } className="is-primary">
									{ __( 'Upgrade to Professional' ) }
								</Button>
							</p>
						</div>
					)
				}
				planCard = (
					<div className="jp-landing__plan-features">
						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title">{ __( 'Jetpack Anti-spam' ) }</h3>
							<p>{ __( 'Bulletproof spam filtering help maintain peace of mind while you build and grow your site.' ) }</p>
							{
								this.props.isFetchingPluginsData ? '' :
									this.props.isPluginInstalled( 'akismet/akismet.php' )
									&& this.props.isPluginActive( 'akismet/akismet.php' ) ? (
										<Button href={ this.props.siteAdminUrl + 'admin.php?page=akismet-key-config' } className="is-primary">
											{ __( 'View your spam stats' ) }
										</Button>
									)
									: (
										<Button href={ 'https://wordpress.com/plugins/setup/' + this.props.siteRawUrl } className="is-primary">
											{ __( 'Configure Akismet' ) }
										</Button>
									)
							}
						</div>

						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title">{ __( 'Jetpack Security Scanning & Backups' ) }</h3>
							<p>{ __( 'Realtime backup with unlimited space, one-click restores, bulletproof spam monitoring, malware defense, and brute-force login protection - all in one place.' ) }</p>
							<Button href="https://dashboard.vaultpress.com/" className="is-primary">
								{ __( 'View your security dashboard' ) }
							</Button>
						</div>
						{ needMore }
					</div>
				);
				break;

			case 'jetpack_free':
			case 'dev':
				planCard = (
					<div className="jp-landing__plan-features">
						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title">{ __( 'Maximum grade security' ) }</h3>
							<p>{ __( 'Realtime backup with unlimited space, one-click restores, bulletproof spam monitoring, malware defense and brute-force login protection - all in one place and optimized for WordPress.' ) }</p>
						</div>
						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title">{ __( 'Lock out the bad guys' ) }</h3>
							<p>{ __( 'Bulletproof spam filtering protects your brand, your readers, and improves SEO. Brute force login protection helps maintain peace of mind and keeps your backend safe from intruders.' ) }</p>
						</div>

						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title">{ __( 'Enjoy priority support' ) }</h3>
							<p>{ __( 'Need help? A Happiness Engineer can answer questions about your site, your account or how to do about anything.' ) }</p>
						</div>
					</div>
				);
				break;

			default:
				planCard = (
					<div className="jp-landing__plan-features">
						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title is-placeholder"> </h3>
							<p className="jp-landing__plan-features-text is-placeholder"> </p>
						</div>
						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title is-placeholder"> </h3>
							<p className="jp-landing__plan-features-text is-placeholder"> </p>
						</div>

						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title is-placeholder"> </h3>
							<p className="jp-landing__plan-features-text is-placeholder"> </p>
						</div>
					</div>
				);
				break;
		}
		return (
			<div>
				<QuerySitePlugins />
				{ planCard	}
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isFetchingPluginsData: isFetchingPluginsData( state ),
			isPluginActive: ( plugin_slug ) => isPluginActive( state, plugin_slug ),
			isPluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug )
		};
	},
	( dispatch ) => {
		return {
			fetchPluginsData: () => dispatch( fetchPluginsData() )
		};
	}
)( PlanBody );
