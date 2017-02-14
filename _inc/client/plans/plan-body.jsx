/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';

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
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isActivatingModule
} from 'state/modules';
import QuerySitePlugins from 'components/data/query-site-plugins';

const PlanBody = React.createClass( {
	render() {
		let planCard = '';
		switch ( this.props.plan ) {
			case 'jetpack_personal':
			case 'jetpack_personal_monthly':
			case 'jetpack_premium':
			case 'jetpack_premium_monthly':
			case 'jetpack_business':
			case 'jetpack_business_monthly':
				planCard = (
					<div className="jp-landing__plan-features">
						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title">{ __( 'Spam Protection' ) }</h3>
							<p>{ __( 'State-of-the-art spam defense powered by Akismet.' ) }</p>
							{
								this.props.isFetchingPluginsData ? '' :
									this.props.isPluginInstalled( 'akismet/akismet.php' )
									&& this.props.isPluginActive( 'akismet/akismet.php' ) ? (
										<Button href={ this.props.siteAdminUrl + 'admin.php?page=akismet-key-config' } className="is-primary">
											{ __( 'View your spam stats' ) }
										</Button>
									)
									: (
										<Button href={ 'https://wordpress.com/plugins/setup/' + this.props.siteRawUrl + '?only=akismet' } className="is-primary">
											{ __( 'Configure Akismet' ) }
										</Button>
									)
							}
						</div>

					{
						includes( [ 'jetpack_personal', 'jetpack_personal_monthly' ], this.props.plan ) ?
							<div className="jp-landing__plan-features-card">
								<h3 className="jp-landing__plan-features-title">{ __( 'Backups' ) }</h3>
								<p>{ __( 'Daily backup of all your site data with unlimited space and one-click restores (powered by VaultPress).' ) }</p>
								{
									this.props.isFetchingPluginsData ? '' :
									this.props.isPluginInstalled( 'vaultpress/vaultpress.php' )
									&& this.props.isPluginActive( 'vaultpress/vaultpress.php' ) ? (
										<Button href="https://dashboard.vaultpress.com/" className="is-primary">
											{ __( 'View your security dashboard' ) }
										</Button>
									)
									: (
										<Button href={ 'https://wordpress.com/plugins/setup/' + this.props.siteRawUrl + '?only=vaultpress' } className="is-primary">
											{ __( 'Configure VaultPress' ) }
										</Button>
									)
								}
							</div>
						: ''
					}

					{
						includes( [ 'jetpack_premium', 'jetpack_premium_monthly' ], this.props.plan ) ?
							<div className="jp-landing__plan-features-card">
								<h3 className="jp-landing__plan-features-title">{ __( 'Backups & Security Scanning' ) }</h3>
								<p>{ __( 'Daily backup of all your site data with unlimited space, one-click restores, automated security scanning, and priority support (powered by VaultPress).' ) }</p>
								{
									this.props.isFetchingPluginsData ? '' :
									this.props.isPluginInstalled( 'vaultpress/vaultpress.php' )
									&& this.props.isPluginActive( 'vaultpress/vaultpress.php' ) ? (
										<Button href="https://dashboard.vaultpress.com/" className="is-primary">
											{ __( 'View your security dashboard' ) }
										</Button>
									)
									: (
										<Button href={ 'https://wordpress.com/plugins/setup/' + this.props.siteRawUrl + '?only=vaultpress' } className="is-primary">
											{ __( 'Configure VaultPress' ) }
										</Button>
									)
								}
							</div>
						: ''
					}

					{
						includes( [ 'jetpack_business', 'jetpack_business_monthly' ], this.props.plan ) ?
							<div className="jp-landing__plan-features-card">
								<h3 className="jp-landing__plan-features-title">{ __( 'Backups & Security Scanning' ) }</h3>
								<p>{ __( 'Real-time backup of all your site data with unlimited space, one-click restores, automated security scanning, one-click threat resolution, and priority support (powered by VaultPress).' ) }</p>
								{
									this.props.isFetchingPluginsData ? '' :
									this.props.isPluginInstalled( 'vaultpress/vaultpress.php' )
									&& this.props.isPluginActive( 'vaultpress/vaultpress.php' ) ? (
										<Button href="https://dashboard.vaultpress.com/" className="is-primary">
											{ __( 'View your security dashboard' ) }
										</Button>
									)
									: (
										<Button href={ 'https://wordpress.com/plugins/setup/' + this.props.siteRawUrl + '?only=vaultpress' } className="is-primary">
											{ __( 'Configure VaultPress' ) }
										</Button>
									)
								}
							</div>
						: ''
					}

					{
						includes( [ 'jetpack_premium', 'jetpack_premium_monthly', 'jetpack_business', 'jetpack_business_monthly' ], this.props.plan ) ?
							<div className="jp-landing__plan-features-card">
								<h3 className="jp-landing__plan-features-title">{ __( 'Ads' ) }</h3>
								<p>{ __( 'Earn income by allowing Jetpack to display high quality ads (powered by WordAds).' ) }</p>
								{
									this.props.isModuleActivated( 'wordads' ) ? (
										<Button href={ 'https://wordpress.com/ads/earnings/' + this.props.siteRawUrl } className="is-primary">
											{ __( 'View your earnings' ) }
										</Button>
									)
										: (
										<Button
											onClick={ this.props.activateModule.bind( null, 'wordads' ) }
											className="is-primary"
											disabled={ this.props.isActivatingModule( 'wordads' ) }
										>
											{ __( 'Activate Ads' ) }
										</Button>
									)
								}
							</div>
							: ''
					}

					{
						includes( [ 'jetpack_premium', 'jetpack_premium_monthly' ], this.props.plan ) ?
							<div className="jp-landing__plan-features-card">
								<h3 className="jp-landing__plan-features-title">{ __( 'Video Hosting' ) }</h3>
								<p>{ __( '13Gb of fast, optimized, and ad-free video hosting for your site (powered by VideoPress).' ) }</p>
								{
									this.props.isModuleActivated( 'videopress' ) ? (
										<Button href={ this.props.siteAdminUrl + 'upload.php' } className="is-primary">
											{ __( 'Upload Videos Now' ) }
										</Button>
									)
										: (
										<Button
											onClick={ this.props.activateModule.bind( null, 'videopress' ) }
											className="is-primary"
											disabled={ this.props.isActivatingModule( 'videopress' ) }
										>
											{ __( 'Activate VideoPress' ) }
										</Button>
									)
								}
							</div>
							: ''
					}

					{
						includes( [ 'jetpack_business', 'jetpack_business_monthly' ], this.props.plan ) ?
							<div className="jp-landing__plan-features-card">
								<h3 className="jp-landing__plan-features-title">{ __( 'Video Hosting' ) }</h3>
								<p>{ __( 'Fast, optimized, ad-free, and unlimited video hosting for your site (powered by VideoPress).' ) }</p>
								{
									this.props.isModuleActivated( 'videopress' ) ? (
										<Button href={ this.props.siteAdminUrl + 'upload.php' } className="is-primary">
											{ __( 'Upload Videos Now' ) }
										</Button>
									)
										: (
										<Button
											onClick={ this.props.activateModule.bind( null, 'videopress' ) }
											className="is-primary"
											disabled={ this.props.isActivatingModule( 'videopress' ) }
										>
											{ __( 'Activate VideoPress' ) }
										</Button>
									)
								}
							</div>
							: ''
					}

					{
						includes( [ 'jetpack_business', 'jetpack_business_monthly' ], this.props.plan ) ?

							<div className="jp-landing__plan-features-card">
								<h3 className="jp-landing__plan-features-title">{ __( 'SEO Tools' ) }</h3>
								<p>{ __( 'Advanced SEO tools to help your site get found when people search for relevant content.' ) }</p>
								{
									this.props.isFetchingPluginsData ? '' :
									this.props.isModuleActivated( 'seo-tools' ) ? (
										<Button href={ 'https://wordpress.com/settings/seo/' + this.props.siteRawUrl } className="is-primary">
											{ __( 'Configure Site SEO' ) }
										</Button>
									)
									: (
										<Button
											onClick={ this.props.activateModule.bind( null, 'seo-tools' ) }
											className="is-primary"
										    disabled={ this.props.isActivatingModule( 'seo-tools' ) }
										>
											{ __( 'Activate SEO Tools' ) }
										</Button>
									)
								}
							</div>
						: ''
					}

					{
						includes( [ 'jetpack_business', 'jetpack_business_monthly' ], this.props.plan ) ?
							<div className="jp-landing__plan-features-card">
								<h3 className="jp-landing__plan-features-title">{ __( 'Google Analytics' ) }</h3>
								<p>{ __( 'Track website statistics with Google Analytics for a deeper understanding of your website visitors and customers.' ) }</p>
								{
									this.props.isFetchingPluginsData ? '' :
									this.props.isModuleActivated( 'google-analytics' ) ? (
										<Button href={ 'https://wordpress.com/settings/analytics/' + this.props.siteRawUrl } className="is-primary">
											{ __( 'Configure Google Analytics' ) }
										</Button>
									)
									: (
										<Button
											onClick={ this.props.activateModule.bind( null, 'google-analytics' ) }
											className="is-primary"
											disabled={ this.props.isActivatingModule( 'google-analytics' ) }
										>
											{ __( 'Activate Google Analytics' ) }
										</Button>
									)
								}
							</div>
							: ''
					}

					{
						includes( [ 'jetpack_personal', 'jetpack_personal_monthly' ], this.props.plan ) ?
							<div className="jp-landing__plan-features-card">
								<h3 className="jp-landing__plan-features-title">{ __( 'Need more? Running a business site?' ) }</h3>
								<p>{ __( 'If your site is important to you, consider protecting and improving it with some of our advanced features: ' ) }</p>
								<p> &mdash; { __( 'Daily and on-demand security scanning' ) }</p>
								<p> &mdash; { __( 'Real-time backups and one-click threat resolution' ) }</p>
								<p> &mdash; { __( 'Unlimited and ad-free video hosting' ) }</p>
								<p> &mdash; { __( 'Advanced SEO tools' ) }</p>
								<p> &mdash; { __( 'Income generation from ads' ) }</p>
								<p>
									<Button href={ 'https://jetpack.com/redirect/?source=plans-compare-personal&site=' + this.props.siteRawUrl } className="is-primary">
										{ __( 'Compare Plans' ) }
									</Button>
								</p>
							</div>
						: ''
					}

					{
						includes( [ 'jetpack_premium', 'jetpack_premium_monthly' ], this.props.plan ) ?
							<div className="jp-landing__plan-features-card">
								<h3 className="jp-landing__plan-features-title">{ __( 'Need more? Running a business site?' ) }</h3>
								<p>{ __( 'If your site is important to you, consider protecting and improving it with some of our advanced features: ' ) }</p>
								<p> &mdash; { __( 'On-demand security scanning' ) }</p>
								<p> &mdash; { __( 'Real-time backups' ) }</p>
								<p> &mdash; { __( 'One-click threat resolution' ) }</p>
								<p> &mdash; { __( 'Advanced SEO tools' ) }</p>
								<p> &mdash; { __( 'Income generation from ads' ) }</p>
								<p>
									<Button href={ 'https://jetpack.com/redirect/?source=plans-compare-premium&site=' + this.props.siteRawUrl } className="is-primary">
										{ __( 'Compare Plans' ) }
									</Button>
								</p>
							</div>
						: ''
					}
				</div>
			);
			break;

			case 'jetpack_free':
			case 'dev':
				planCard = (
					<div className="jp-landing__plan-features">
						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title">{ __( 'Maximum grade security' ) }</h3>
							<p>{ __( 'Real-time backup with unlimited space, one-click restores, bulletproof spam monitoring, malware defense, and brute-force login protection - all in one place and optimized for WordPress.' ) }</p>
							<p>{ __( 'Bulletproof spam filtering protects your brand, your readers, and improves SEO. Malware scanning helps maintain peace of mind and keeps your backend safe from intruders.' ) }</p>
						</div>
						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title">{ __( 'Premium traffic and monetization tools' ) }</h3>
							<p>{ __( 'The Jetpack Premium plan now offers you the ability to generate income from your site by showing high-quality paid ads to your visitors. Professional plan customers also benefit from SEO tools to help optimize search engine traffic.' ) }</p>
						</div>

						<div className="jp-landing__plan-features-card">
							<h3 className="jp-landing__plan-features-title">{ __( 'Enjoy priority support' ) }</h3>
							<p>{ __( 'We support all Jetpack users, regardless of plan. But customers on a paid subscription enjoy priority support so that security issues are identified and fixed for you as soon as possible. ' ) }</p>
						</div>

						<p>
							<Button href={ 'https://jetpack.com/redirect/?source=plans-main-bottom&site=' + this.props.siteRawUrl } className="is-primary">
								{ __( 'Compare Plans' ) }
							</Button>
						</p>
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
			isPluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug ),
			isModuleActivated: ( module_slug ) => _isModuleActivated( state, module_slug ),
			isActivatingModule: ( module_slug ) => isActivatingModule( state, module_slug )
		};
	},
	( dispatch ) => {
		return {
			fetchPluginsData: () => dispatch( fetchPluginsData() ),
			activateModule: ( slug ) => {
				return dispatch( activateModule( slug ) );
			}
		};
	}
)( PlanBody );
