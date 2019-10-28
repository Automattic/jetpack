/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';
import { getPlanClass, FEATURE_UNLIMITED_PREMIUM_THEMES } from 'lib/plans/constants';
import { get, includes } from 'lodash';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';
import {
	fetchPluginsData,
	isFetchingPluginsData,
	isPluginActive,
	isPluginInstalled,
} from 'state/site/plugins';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isActivatingModule,
	getModuleOverride,
} from 'state/modules';
import { updateSettings } from 'state/settings/actions';
import { getSetting, isUpdatingSetting } from 'state/settings/reducer';
import QuerySitePlugins from 'components/data/query-site-plugins';
import { showBackups } from 'state/initial-state';

class MyPlanBody extends React.Component {
	static propTypes = {
		plan: PropTypes.string,
	};

	static defaultProps = {
		plan: '',
	};

	trackPlansClick = target => {
		analytics.tracks.recordJetpackClick( {
			page: 'my-plan',
			target: target,
			plan: this.props.plan,
		} );
	};

	handleButtonClickForTracking = target => {
		return () => this.trackPlansClick( target );
	};

	activateAds = () => {
		this.props.activateModule( 'wordads' );
		this.trackPlansClick( 'activate_wordads' );
	};

	activatePublicize = () => {
		this.props.activateModule( 'publicize' );
		this.trackPlansClick( 'activate_publicize' );
	};

	activateSearch = () => {
		this.props.activateModule( 'search' );
		this.trackPlansClick( 'activate_search' );
	};

	activateVideoPress = () => {
		this.props.activateFeature( 'videopress' );
		this.trackPlansClick( 'activate_videopress' );
	};

	activateSeo = () => {
		this.props.activateModule( 'seo-tools' );
		this.trackPlansClick( 'activate_seo' );
	};

	activateGoogleAnalytics = () => {
		this.props.activateModule( 'google-analytics' );
		this.trackPlansClick( 'activate_ga' );
	};

	render() {
		let planCard = '';
		const planClass = 'dev' !== this.props.plan ? getPlanClass( this.props.plan ) : 'dev';
		const premiumThemesActive = includes(
				this.props.activeFeatures,
				FEATURE_UNLIMITED_PREMIUM_THEMES
			),
			rewindActive = 'active' === get( this.props.rewindStatus, [ 'state' ], false ),
			hideVaultPressCard =
				! this.props.showBackups ||
				( ! rewindActive && 'unavailable' !== get( this.props.rewindStatus, [ 'state' ], false ) );

		const getJetpackBackupCard = args => {
			const { title, description } = args;

			return (
				<div className="jp-landing__plan-features-card">
					<div className="jp-landing__plan-features-img">
						<img
							src={ imagePath + '/jetpack-backup.svg' }
							className="jp-landing__plan-features-icon"
							alt={ __( 'A Jetpack Site securely backed up with Jetpack Backup' ) }
						/>
					</div>
					<div className="jp-landing__plan-features-text">
						<h3 className="jp-landing__plan-features-title">{ title }</h3>
						<p>{ description }</p>
						<Button
							onClick={ this.handleButtonClickForTracking( 'view_backup_dash' ) }
							href={ 'https://wordpress.com/activity-log/' + this.props.siteRawUrl }
						>
							{ __( 'View Your Backups' ) }
						</Button>
					</div>
				</div>
			);
		};

		const getRewindVaultPressCard = () => {
			if ( hideVaultPressCard ) {
				return;
			}

			if ( rewindActive ) {
				return (
					<div className="jp-landing__plan-features-card">
						<div className="jp-landing__plan-features-img">
							<img
								src={ imagePath + '/jetpack-security.svg' }
								className="jp-landing__plan-features-icon"
								alt={ __( 'A secure site, locked and protected by Jetpack' ) }
							/>
						</div>
						<div className="jp-landing__plan-features-text">
							<h3 className="jp-landing__plan-features-title">{ __( 'Site Backups' ) }</h3>
							<p>
								{ __(
									'Real-time backup of all your site data with unlimited space, one-click restores, and automated security scanning.'
								) }
							</p>
							<Button
								onClick={ this.handleButtonClickForTracking( 'view_security_dash_rewind' ) }
								href={ 'https://wordpress.com/activity-log/' + this.props.siteRawUrl }
							>
								{ __( 'View your security activity' ) }
							</Button>
						</div>
					</div>
				);
			}

			let description = '';
			switch ( planClass ) {
				case 'is-personal-plan':
					description = __(
						'Daily backup of all your site data with unlimited space and one-click restores'
					);
					break;
				case 'is-premium-plan':
					description = __(
						'Daily backup of all your site data with unlimited space, one-click restores, automated security scanning, and priority support'
					);
					break;
				case 'is-business-plan':
					description = __(
						'Real-time backup of all your site data with unlimited space, one-click restores, automated security scanning, and priority support'
					);
					break;
				default:
					description = '';
					break;
			}

			return (
				<div className="jp-landing__plan-features-card">
					<div className="jp-landing__plan-features-img">
						<img
							src={ imagePath + '/jetpack-security.svg' }
							className="jp-landing__plan-features-icon"
							alt={ __( 'A secure site, locked and protected by Jetpack' ) }
						/>
					</div>
					<div className="jp-landing__plan-features-text">
						<h3 className="jp-landing__plan-features-title">{ __( 'Site Security' ) }</h3>
						<p>{ description + __( ' (powered by VaultPress).' ) }</p>
						{ this.props.isPluginInstalled( 'vaultpress/vaultpress.php' ) &&
						this.props.isPluginActive( 'vaultpress/vaultpress.php' ) ? (
							<Button
								onClick={ this.handleButtonClickForTracking( 'view_security_dash' ) }
								href="https://dashboard.vaultpress.com/"
							>
								{ __( 'View your security dashboard' ) }
							</Button>
						) : (
							<Button
								onClick={ this.handleButtonClickForTracking( 'configure_vault' ) }
								href={
									'https://wordpress.com/plugins/setup/' +
									this.props.siteRawUrl +
									'?only=vaultpress'
								}
							>
								{ __( 'View settings' ) }
							</Button>
						) }
					</div>
				</div>
			);
		};

		let jetpackBackupCard;
		if ( 'is-daily-backup-plan' === planClass ) {
			jetpackBackupCard = getJetpackBackupCard( {
				title: __( 'Automated Daily Backups' ),
				description: __(
					'We back up your website every day, so you never have to worry about your data again.'
				),
			} );
		}

		if ( 'is-realtime-backup-plan' === planClass ) {
			jetpackBackupCard = getJetpackBackupCard( {
				title: __( 'Automated Real-time Backups' ),
				description: __(
					'We back up your website with every change you make, making it easy to fix your mistakes.'
				),
			} );
		}

		switch ( planClass ) {
			case 'is-personal-plan':
			case 'is-premium-plan':
			case 'is-business-plan':
				planCard = (
					<div className="jp-landing__plan-features">
						{ 'is-personal-plan' === planClass && getRewindVaultPressCard() }

						{ 'is-premium-plan' === planClass && getRewindVaultPressCard() }

						{ 'is-business-plan' === planClass && getRewindVaultPressCard() }

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + '/jetpack-speed-icon.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'A fast and performant website' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Optimized performance' ) }
								</h3>
								<p>
									{ __(
										'Load pages faster by serving your images from our global network of servers.'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'paid_performance' ) }
									href={ this.props.siteAdminUrl + 'admin.php?page=jetpack#/performance' }
								>
									{ __( 'Make your site faster' ) }
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + '/jetpack-spam.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'A folder holding real comments' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">{ __( 'Anti-spam' ) }</h3>
								<p>{ __( 'Spam is automatically blocked from your comments.' ) }</p>
								{ this.props.isPluginInstalled( 'akismet/akismet.php' ) &&
								this.props.isPluginActive( 'akismet/akismet.php' ) ? (
									<Button
										onClick={ this.handleButtonClickForTracking( 'view_spam_stats' ) }
										href={ this.props.siteAdminUrl + 'admin.php?page=akismet-key-config' }
									>
										{ __( 'View your spam stats' ) }
									</Button>
								) : (
									<Button
										onClick={ this.handleButtonClickForTracking( 'configure_akismet' ) }
										href={
											'https://wordpress.com/plugins/setup/' +
											this.props.siteRawUrl +
											'?only=akismet'
										}
									>
										{ __( 'View settings' ) }
									</Button>
								) }
							</div>
						</div>

						{ ( 'is-business-plan' === planClass || 'is-premium-plan' === planClass ) &&
							'inactive' !== this.props.getModuleOverride( 'videopress' ) && (
								<div className="jp-landing__plan-features-card">
									<div className="jp-landing__plan-features-img">
										<img
											src={ imagePath + '/jetpack-video-hosting.svg' }
											className="jp-landing__plan-features-icon"
											alt={ __( 'A cloud with multiple types of content floating around it' ) }
										/>
									</div>
									<div className="jp-landing__plan-features-text">
										<h3 className="jp-landing__plan-features-title">{ __( 'Video Hosting' ) }</h3>
										<p>
											{ __( 'High-speed, high-definition video hosting with no third-party ads.' ) }
										</p>
										{ this.props.getFeatureState( 'videopress' ) ? (
											<Button
												onClick={ this.handleButtonClickForTracking( 'upload_videos' ) }
												href={ this.props.siteAdminUrl + 'upload.php' }
											>
												{ __( 'Upload videos' ) }
											</Button>
										) : (
											<Button
												onClick={ this.activateVideoPress }
												disabled={ this.props.isActivatingFeature( 'videopress' ) }
											>
												{ __( 'Activate video hosting' ) }
											</Button>
										) }
									</div>
								</div>
							) }

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + '/jetpack-site-activity.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __(
										'Interface showing a chronological list of changes and updates in a site'
									) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">{ __( 'Activity' ) }</h3>
								<p>
									{ __(
										'View a chronological list of all the changes and updates to your site in an organized, readable way.'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'view_site_activity' ) }
									href={ 'https://wordpress.com/activity-log/' + this.props.siteRawUrl }
								>
									{ __( 'View your site activity' ) }
								</Button>
							</div>
						</div>

						{ ( 'is-business-plan' === planClass || 'is-premium-plan' === planClass ) &&
							'inactive' !== this.props.getModuleOverride( 'wordads' ) && (
								<div className="jp-landing__plan-features-card">
									<div className="jp-landing__plan-features-img">
										<img
											src={ imagePath + '/jetpack-wordads.svg' }
											className="jp-landing__plan-features-icon"
											alt={ __( 'A chart showing an healthy increase in earnings' ) }
										/>
									</div>
									<div className="jp-landing__plan-features-text">
										<h3 className="jp-landing__plan-features-title">
											{ __( 'Monetize your site with ads' ) }
										</h3>
										<p>
											{ __(
												'WordAds lets you earn money by displaying promotional content. Start earning today.'
											) }
										</p>
										{ this.props.isModuleActivated( 'wordads' ) ? (
											<Button
												onClick={ this.handleButtonClickForTracking( 'view_earnings' ) }
												href={ 'https://wordpress.com/ads/earnings/' + this.props.siteRawUrl }
											>
												{ __( 'View your earnings' ) }
											</Button>
										) : (
											<Button
												onClick={ this.activateAds }
												disabled={ this.props.isActivatingModule( 'wordads' ) }
											>
												{ __( 'Start earning' ) }
											</Button>
										) }
									</div>
								</div>
							) }

						{ 'is-business-plan' === planClass &&
							! this.props.getModuleOverride( 'search' ) &&
							'inactive' !== this.props.getModuleOverride( 'search' ) && (
								<div className="jp-landing__plan-features-card">
									<div className="jp-landing__plan-features-img">
										<img
											src={ imagePath + '/jetpack-search-icon.svg' }
											className="jp-landing__plan-features-icon"
											alt={ __( 'A hand holding a loupe' ) }
										/>
									</div>
									<div className="jp-landing__plan-features-text">
										<h3 className="jp-landing__plan-features-title">{ __( 'Jetpack Search' ) }</h3>
										<p>
											{ __(
												'Replace the default WordPress search with better results and filtering powered by Elasticsearch.'
											) }
										</p>
										{ this.props.isModuleActivated( 'search' ) ? (
											<Button
												onClick={ this.handleButtonClickForTracking( 'search_customize' ) }
												href={ this.props.siteAdminUrl + 'widgets.php' }
											>
												{ __( 'Customize Search Widget' ) }
											</Button>
										) : (
											<Button
												onClick={ this.activateSearch }
												disabled={ this.props.isActivatingModule( 'search' ) }
											>
												{ __( 'Activate Jetpack Search' ) }
											</Button>
										) }
									</div>
								</div>
							) }

						{ ( 'is-business-plan' === planClass || 'is-premium-plan' === planClass ) &&
							'inactive' !== this.props.getModuleOverride( 'seo-tools' ) && (
								<div className="jp-landing__plan-features-card">
									<div className="jp-landing__plan-features-img">
										<img
											src={ imagePath + '/jetpack-performance-icon.svg' }
											className="jp-landing__plan-features-icon"
											alt={ __( 'Site stats showing an evolution in traffic and engagement' ) }
										/>
									</div>
									<div className="jp-landing__plan-features-text">
										<h3 className="jp-landing__plan-features-title">{ __( 'SEO Tools' ) }</h3>
										<p>
											{ __(
												'Advanced SEO tools to help your site get found when people search for relevant content.'
											) }
										</p>
										{ this.props.isModuleActivated( 'seo-tools' ) ? (
											<Button
												onClick={ this.handleButtonClickForTracking( 'configure_seo' ) }
												href={ 'https://wordpress.com/marketing/traffic/' + this.props.siteRawUrl }
											>
												{ __( 'Configure site SEO' ) }
											</Button>
										) : (
											<Button
												onClick={ this.activateSeo }
												disabled={ this.props.isActivatingModule( 'seo-tools' ) }
											>
												{ __( 'Activate SEO tools' ) }
											</Button>
										) }
									</div>
								</div>
							) }

						{ ( 'is-business-plan' === planClass || 'is-premium-plan' === planClass ) &&
							'inactive' !== this.props.getModuleOverride( 'google-analytics' ) && (
								<div className="jp-landing__plan-features-card">
									<div className="jp-landing__plan-features-img">
										<img
											src={ imagePath + '/jetpack-google-analytics.svg' }
											className="jp-landing__plan-features-icon"
											alt={ __( 'Site stats showing an evolution in traffic and engagement' ) }
										/>
									</div>
									<div className="jp-landing__plan-features-text">
										<h3 className="jp-landing__plan-features-title">
											{ __( 'Google Analytics' ) }
										</h3>
										<p>
											{ __(
												'Complement WordPress.com’s stats with Google’s in-depth look at your visitors and traffic patterns.'
											) }
										</p>
										{ this.props.isModuleActivated( 'google-analytics' ) ? (
											<Button
												onClick={ this.handleButtonClickForTracking( 'configure_ga' ) }
												href={ 'https://wordpress.com/marketing/traffic/' + this.props.siteRawUrl }
											>
												{ __( 'Configure Google Analytics' ) }
											</Button>
										) : (
											<Button
												onClick={ this.activateGoogleAnalytics }
												disabled={ this.props.isActivatingModule( 'google-analytics' ) }
											>
												{ __( 'Activate Google Analytics' ) }
											</Button>
										) }
									</div>
								</div>
							) }

						{ premiumThemesActive && (
							<div className="jp-landing__plan-features-card">
								<div className="jp-landing__plan-features-img">
									<img
										src={ imagePath + '/jetpack-themes.svg' }
										className="jp-landing__plan-features-icon"
										alt={ __( 'A secure site, locked and protected by Jetpack' ) }
									/>
								</div>
								<div className="jp-landing__plan-features-text">
									<h3 className="jp-landing__plan-features-title">
										{ __( 'Try a premium theme' ) }
									</h3>
									<p>
										{ __(
											'Access hundreds of beautifully designed premium themes at no extra cost.'
										) }
									</p>
									<Button
										onClick={ this.handleButtonClickForTracking( 'premium_themes' ) }
										href={ 'https://wordpress.com/themes/premium/' + this.props.siteRawUrl }
									>
										{ __( 'Browse premium themes' ) }
									</Button>
								</div>
							</div>
						) }

						{ ( 'is-business-plan' === planClass || 'is-premium-plan' === planClass ) &&
							'inactive' !== this.props.getModuleOverride( 'publicize' ) && (
								<div className="jp-landing__plan-features-card">
									<div className="jp-landing__plan-features-img">
										<img
											src={ imagePath + '/jetpack-marketing.svg' }
											className="jp-landing__plan-features-icon"
											alt={ __( 'A secure site, locked and protected by Jetpack' ) }
										/>
									</div>
									<div className="jp-landing__plan-features-text">
										<h3 className="jp-landing__plan-features-title">
											{ __( 'Marketing Automation' ) }
										</h3>
										<p>
											{ __(
												'Schedule unlimited tweets, Facebook posts, and other social posts in advance.'
											) }
										</p>
										{ this.props.isModuleActivated( 'publicize' ) ? (
											<Button
												onClick={ this.handleButtonClickForTracking( 'schedule_posts' ) }
												href={ 'https://wordpress.com/posts/' + this.props.siteRawUrl }
											>
												{ __( 'Schedule posts' ) }
											</Button>
										) : (
											<Button
												onClick={ this.activatePublicize }
												disabled={ this.props.isActivatingModule( 'publicize' ) }
											>
												{ __( 'Activate Publicize' ) }
											</Button>
										) }
									</div>
								</div>
							) }
					</div>
				);
				break;

			case 'is-free-plan':
			case 'is-daily-backup-plan':
			case 'is-realtime-backup-plan':
			case 'dev':
				planCard = (
					<div className="jp-landing__plan-features">
						{ jetpackBackupCard }
						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + '/jetpack-security.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'A secure site, locked and protected by Jetpack' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">{ __( 'Always-on security' ) }</h3>
								<p>
									{ __(
										'Prevent login attacks, and get instant notifications when there’s an issue with your site.'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'free_security' ) }
									href={ 'https://wordpress.com/settings/security/' + this.props.siteRawUrl }
								>
									{ __( 'Set up your site security' ) }
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + '/jetpack-speed-icon.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'A fast and performant website' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Optimized performance' ) }
								</h3>
								<p>
									{ __(
										'Load pages faster by serving your images from our global network of servers.'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'free_performance' ) }
									href={ this.props.siteAdminUrl + 'admin.php?page=jetpack#/performance' }
								>
									{ __( 'Make your site faster' ) }
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + '/jetpack-themes.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'A wide variety of themes and tools to customize a site' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Design the perfect website' ) }
								</h3>
								<p>
									{ __(
										'Get unlimited access to hundreds of professional themes, and customize your site exactly how you like it.'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'free_themes' ) }
									href={ 'https://wordpress.com/themes/' + this.props.siteRawUrl }
								>
									{ __( 'Explore free themes' ) }
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + '/jetpack-performance-icon.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'Site stats showing an evolution in traffic and engagement' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Increase traffic to your site' ) }
								</h3>
								<p>
									{ __(
										'Reach a wider audience by automatically sharing your posts on social media.'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'free_sharing' ) }
									href={ 'https://wordpress.com/marketing/connections/' + this.props.siteRawUrl }
								>
									{ __( 'Start sharing' ) }
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + '/jetpack-site-activity.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __(
										'Interface showing a chronological list of changes and updates in a site'
									) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">{ __( 'Site activity' ) }</h3>
								<p>
									{ __(
										'View a chronological list of all the changes and updates to your site in an organized, readable way.'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'view_site_activity' ) }
									href={ 'https://wordpress.com/activity-log/' + this.props.siteRawUrl }
								>
									{ __( 'View your site activity' ) }
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + '/jetpack-support.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'Chat bubbles representing getting in touch with support' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Support documentation' ) }
								</h3>
								<p>
									{ __(
										'Need help? Learn about getting started, customizing your site, using advanced code snippets, and more.'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'free_support_documentation' ) }
									href="https://jetpack.com/support/"
								>
									{ __( 'Search support docs' ) }
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Take your site to the next level!' ) }
								</h3>
								<ul className="jp-landing__plan-features-list">
									<li>{ __( 'Get peace of mind with automated backups.' ) }</li>
									<li>{ __( 'Resolve issues quickly with priority support.' ) }</li>
									<li>{ __( 'Expand your audience with pro SEO tools.' ) }</li>
									<li>{ __( 'Customize your social posting schedule.' ) }</li>
									<li>{ __( 'Monetize your site by running high quality ads.' ) }</li>
								</ul>
								<Button
									className="is-primary"
									onClick={ this.handleButtonClickForTracking( 'free_explore_jetpack_plans' ) }
									href={ '#/plans' }
								>
									{ __( 'Upgrade Jetpack now' ) }
								</Button>
							</div>
						</div>
					</div>
				);
				break;

			default:
				planCard = (
					<div className="jp-landing__plan-features is-loading">
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
				{ planCard }
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			isFetchingPluginsData: isFetchingPluginsData( state ),
			isPluginActive: plugin_slug => isPluginActive( state, plugin_slug ),
			isPluginInstalled: plugin_slug => isPluginInstalled( state, plugin_slug ),
			isModuleActivated: module_slug => _isModuleActivated( state, module_slug ),
			isActivatingModule: module_slug => isActivatingModule( state, module_slug ),
			getModuleOverride: module_slug => getModuleOverride( state, module_slug ),
			showBackups: showBackups( state ),
			getFeatureState: feature => getSetting( state, feature ),
			isActivatingFeature: feature => isUpdatingSetting( state, feature ),
		};
	},
	dispatch => {
		return {
			fetchPluginsData: () => dispatch( fetchPluginsData() ),
			activateModule: slug => {
				return dispatch( activateModule( slug ) );
			},
			activateFeature: feature => dispatch( updateSettings( { [ feature ]: true } ) ),
		};
	}
)( MyPlanBody );
