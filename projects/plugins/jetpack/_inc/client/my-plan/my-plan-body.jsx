import { imagePath } from 'constants/urls';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import QuerySitePlugins from 'components/data/query-site-plugins';
import analytics from 'lib/analytics';
import { getPlanClass } from 'lib/plans/constants';
import { get, includes } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { showBackups } from 'state/initial-state';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isActivatingModule,
	getModuleOverride,
} from 'state/modules';
import { updateSettings } from 'state/settings/actions';
import { getSetting, isUpdatingSetting } from 'state/settings/reducer';
import { siteHasFeature } from 'state/site';
import {
	fetchPluginsData,
	isFetchingPluginsData,
	isPluginActive,
	isPluginInstalled,
} from 'state/site/plugins';

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

	activateVideoPress = () => {
		this.props.activateFeature( 'videopress' );
		this.trackPlansClick( 'activate_videopress' );
	};

	activateGoogleAnalytics = () => {
		this.props.activateModule( 'google-analytics' );
		this.trackPlansClick( 'activate_ga' );
	};

	render() {
		let planCard = '';
		const planClass = 'offline' !== this.props.plan ? getPlanClass( this.props.plan ) : 'offline';
		const isPlanPremiumOrBetter = includes(
			[
				'is-premium-plan',
				'is-business-plan',
				'is-security-t1-plan',
				'is-security-t2-plan',
				'is-complete-plan',

				// DEPRECATED: Daily and Real-time variations will soon be retired.
				// Remove after all customers are migrated to new products.
				'is-daily-security-plan',
				'is-realtime-security-plan',
			],
			planClass
		);
		const rewindActive = 'active' === get( this.props.rewindStatus, [ 'state' ], false ),
			hideVaultPressCard =
				! this.props.showBackups ||
				( ! rewindActive && 'unavailable' !== get( this.props.rewindStatus, [ 'state' ], false ) );

		const getJetpackBackupCard = args => {
			const { title, description } = args;

			return (
				<div className="jp-landing__plan-features-card">
					<div className="jp-landing__plan-features-img">
						<img
							src={ imagePath + 'products/product-jetpack-backup.svg' }
							className="jp-landing__plan-features-icon"
							alt={ __( 'A Jetpack Site securely backed up with Jetpack Backup', 'jetpack' ) }
						/>
					</div>
					<div className="jp-landing__plan-features-text">
						<h3 className="jp-landing__plan-features-title">{ title }</h3>
						<p>{ description }</p>
						<Button
							onClick={ this.handleButtonClickForTracking( 'view_backup_dash' ) }
							href={ getRedirectUrl( 'calypso-activity-log', { site: this.props.siteRawUrl } ) }
							compact
							rna
						>
							<ExternalLink>{ __( 'View your backups', 'jetpack' ) }</ExternalLink>
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
								src={ imagePath + 'products/product-jetpack-backup.svg' }
								className="jp-landing__plan-features-icon"
								alt={ __( 'A secure site, locked and protected by Jetpack', 'jetpack' ) }
							/>
						</div>
						<div className="jp-landing__plan-features-text">
							<h3 className="jp-landing__plan-features-title">
								{ __( 'Site backups', 'jetpack' ) }
							</h3>
							<p>
								{ __(
									'Real-time backup of all your site data with unlimited space, one-click restores, and automated security scanning.',
									'jetpack'
								) }
							</p>
							<Button
								onClick={ this.handleButtonClickForTracking( 'view_security_dash_rewind' ) }
								href={ getRedirectUrl( 'calypso-activity-log', { site: this.props.siteRawUrl } ) }
								compact
								rna
							>
								<ExternalLink>{ __( 'View your security activity', 'jetpack' ) }</ExternalLink>
							</Button>
						</div>
					</div>
				);
			}

			let description = '';
			switch ( planClass ) {
				case 'is-personal-plan':
					description = __(
						'Daily backup of all your site data with unlimited space and one-click restores',
						'jetpack'
					);
					break;
				case 'is-premium-plan':
					description = __(
						'Daily backup of all your site data with unlimited space, one-click restores, automated security scanning, and priority support',
						'jetpack'
					);
					break;
				case 'is-business-plan':
					description = __(
						'Real-time backup of all your site data with unlimited space, one-click restores, automated security scanning, and priority support',
						'jetpack'
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
							src={ imagePath + 'products/product-jetpack-protect.svg' }
							className="jp-landing__plan-features-icon"
							alt={ __( 'A secure site, locked and protected by Jetpack', 'jetpack' ) }
						/>
					</div>
					<div className="jp-landing__plan-features-text">
						<h3 className="jp-landing__plan-features-title">
							{ __( 'Site security', 'jetpack' ) }
						</h3>
						<p>{ description + __( ' (powered by VaultPress).', 'jetpack' ) }</p>
						{ this.props.isPluginInstalled( 'vaultpress/vaultpress.php' ) &&
						this.props.isPluginActive( 'vaultpress/vaultpress.php' ) ? (
							<Button
								onClick={ this.handleButtonClickForTracking( 'view_security_dash' ) }
								href={ getRedirectUrl( 'vaultpress-dashboard' ) }
								compact
								rna
							>
								<ExternalLink> { __( 'View your security dashboard', 'jetpack' ) }</ExternalLink>
							</Button>
						) : (
							<Button
								onClick={ this.handleButtonClickForTracking( 'configure_vault' ) }
								href={ getRedirectUrl( 'calypso-plugins-setup', {
									site: this.props.siteRawUrl,
									query: 'only=vaultpress',
								} ) }
								compact
								rna
							>
								<ExternalLink>{ __( 'View settings', 'jetpack' ) }</ExternalLink>
							</Button>
						) }
					</div>
				</div>
			);
		};

		let jetpackBackupCard;

		// DEPRECATED: Daily and Real-time variations will soon be retired.
		// Remove after all customers are migrated to new products.
		if ( 'is-daily-backup-plan' === planClass ) {
			jetpackBackupCard = getJetpackBackupCard( {
				title: __( 'Automated Daily Backups', 'jetpack' ),
				description: __(
					'We back up your website every day, so you never have to worry about your data again.',
					'jetpack'
				),
			} );
		}

		if (
			[
				'is-backup-t1-plan',
				'is-backup-t2-plan',
				'is-jetpack-starter-plan',

				// DEPRECATED: Daily and Real-time variations will soon be retired.
				// Remove after all customers are migrated to new products.
				'is-realtime-backup-plan',
			].includes( planClass )
		) {
			jetpackBackupCard = getJetpackBackupCard( {
				title: __( 'Automated real-time backups', 'jetpack' ),
				description: __(
					'We back up your website with every change you make, making it easy to fix your mistakes.',
					'jetpack'
				),
			} );
		}

		const getSearchCard = () => {
			return (
				<div className="jp-landing__plan-features-card">
					<div className="jp-landing__plan-features-img">
						<img
							src={ imagePath + 'products/product-jetpack-search.svg' }
							className="jp-landing__plan-features-icon"
							alt={ __( 'A Jetpack Site with the power of Jetpack Search', 'jetpack' ) }
						/>
					</div>
					<div className="jp-landing__plan-features-text">
						<h3 className="jp-landing__plan-features-title">
							{ __( 'Instant search and filtering', 'jetpack' ) }
						</h3>
						<p>
							{ __(
								'Relevant search results and filtering tightly integrated with your theme.',
								'jetpack'
							) }
						</p>
						<Button
							onClick={ this.handleButtonClickForTracking( 'view_search_customizer' ) }
							href={ this.props.siteAdminUrl + 'admin.php?page=jetpack-search-configure' }
							compact
							rna
						>
							{ __( 'Customize Search', 'jetpack' ) }
						</Button>
					</div>
				</div>
			);
		};

		switch ( planClass ) {
			case 'is-personal-plan':
			case 'is-premium-plan':
			case 'is-jetpack-starter-plan':
			case 'is-security-t1-plan':
			case 'is-security-t2-plan':
			case 'is-business-plan':
			case 'is-complete-plan':
			// DEPRECATED: Daily and Real-time variations will soon be retired.
			// Remove after all customers are migrated to new products.
			case 'is-daily-security-plan':
			case 'is-realtime-security-plan':
				planCard = (
					<div className="jp-landing__plan-features">
						{ 'is-personal-plan' === planClass && getRewindVaultPressCard() }
						{ 'is-premium-plan' === planClass && getRewindVaultPressCard() }
						{ 'is-business-plan' === planClass && getRewindVaultPressCard() }
						{ this.props.hasInstantSearch && getSearchCard() }
						{ 'is-jetpack-starter-plan' === planClass && jetpackBackupCard }
						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + 'products/product-jetpack-boost.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'A fast and performant website', 'jetpack' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Optimized performance', 'jetpack' ) }
								</h3>
								<p>
									{ __(
										'Load pages faster by serving your images from our global network of servers.',
										'jetpack'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'paid_performance' ) }
									href={ this.props.siteAdminUrl + 'admin.php?page=jetpack#/performance' }
									compact
									rna
								>
									{ __( 'Make your site faster', 'jetpack' ) }
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + 'products/product-jetpack-anti-spam.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'A folder holding real comments', 'jetpack' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Anti-spam', 'jetpack' ) }
								</h3>
								<p>{ __( 'Spam is automatically blocked from your comments.', 'jetpack' ) }</p>
								{ this.props.isPluginInstalled( 'akismet/akismet.php' ) &&
								this.props.isPluginActive( 'akismet/akismet.php' ) ? (
									<Button
										onClick={ this.handleButtonClickForTracking( 'view_spam_stats' ) }
										href={ `${ this.props.siteAdminUrl }admin.php?page=akismet-key-config&view=stats` }
										compact
										rna
									>
										{ __( 'View your spam stats', 'jetpack' ) }
									</Button>
								) : (
									<Button
										onClick={ this.handleButtonClickForTracking( 'configure_akismet' ) }
										href={ getRedirectUrl( 'calypso-plugins-setup', {
											site: this.props.siteRawUrl,
											query: 'only=akismet',
										} ) }
										compact
										rna
									>
										<ExternalLink>{ __( 'View settings', 'jetpack' ) }</ExternalLink>
									</Button>
								) }
							</div>
						</div>

						{ isPlanPremiumOrBetter &&
							'inactive' !== this.props.getModuleOverride( 'videopress' ) && (
								<div className="jp-landing__plan-features-card">
									<div className="jp-landing__plan-features-img">
										<img
											src={ imagePath + 'products/product-jetpack-videopress.svg' }
											className="jp-landing__plan-features-icon"
											alt={ __(
												'A cloud with multiple types of content floating around it',
												'jetpack'
											) }
										/>
									</div>
									<div className="jp-landing__plan-features-text">
										<h3 className="jp-landing__plan-features-title">
											{ __( 'VideoPress', 'jetpack' ) }
										</h3>
										<p>
											{ __(
												'High-speed, high-definition video hosting with no third-party ads.',
												'jetpack'
											) }
										</p>
										{ this.props.getFeatureState( 'videopress' ) ? (
											<Button
												onClick={ this.handleButtonClickForTracking( 'upload_videos' ) }
												href={ this.props.siteAdminUrl + 'upload.php' }
												compact
												rna
											>
												{ __( 'Upload videos', 'jetpack' ) }
											</Button>
										) : (
											<Button
												onClick={ this.activateVideoPress }
												disabled={ this.props.isActivatingFeature( 'videopress' ) }
												compact
												rna
											>
												{ __( 'Activate VideoPress', 'jetpack' ) }
											</Button>
										) }
									</div>
								</div>
							) }

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + 'plans/jetpack.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __(
										'Interface showing a chronological list of changes and updates in a site',
										'jetpack'
									) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Site activity', 'jetpack' ) }
								</h3>
								<p>
									{ __(
										'View a chronological list of all the changes and updates to your site in an organized, readable way.',
										'jetpack'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'view_site_activity' ) }
									href={ getRedirectUrl( 'calypso-activity-log', { site: this.props.siteRawUrl } ) }
									compact
									rna
								>
									<ExternalLink>{ __( 'View your site activity', 'jetpack' ) }</ExternalLink>
								</Button>
							</div>
						</div>

						{ isPlanPremiumOrBetter && 'inactive' !== this.props.getModuleOverride( 'wordads' ) && (
							<div className="jp-landing__plan-features-card">
								<div className="jp-landing__plan-features-img">
									<img
										src={ imagePath + 'plans/jetpack.svg' }
										className="jp-landing__plan-features-icon"
										alt={ __( 'A chart showing an healthy increase in earnings', 'jetpack' ) }
									/>
								</div>
								<div className="jp-landing__plan-features-text">
									<h3 className="jp-landing__plan-features-title">
										{ __( 'Monetize your site with ads', 'jetpack' ) }
									</h3>
									<p>
										{ __(
											'WordAds lets you earn money by displaying promotional content. Start earning today.',
											'jetpack'
										) }
									</p>
									{ this.props.isModuleActivated( 'wordads' ) ? (
										<Button
											onClick={ this.handleButtonClickForTracking( 'view_earnings' ) }
											href={ getRedirectUrl( 'wpcom-ads-earnings', {
												site: this.props.siteRawUrl,
											} ) }
											compact
											rna
										>
											<ExternalLink>{ __( 'View your earnings', 'jetpack' ) }</ExternalLink>
										</Button>
									) : (
										<Button
											onClick={ this.activateAds }
											disabled={ this.props.isActivatingModule( 'wordads' ) }
											compact
											rna
										>
											{ __( 'Start earning', 'jetpack' ) }
										</Button>
									) }
								</div>
							</div>
						) }

						{ isPlanPremiumOrBetter &&
							'inactive' !== this.props.getModuleOverride( 'google-analytics' ) && (
								<div className="jp-landing__plan-features-card">
									<div className="jp-landing__plan-features-img">
										<img
											src={ imagePath + 'plans/jetpack.svg' }
											className="jp-landing__plan-features-icon"
											alt={ __(
												'Charts depicting an evolution in traffic and engagement',
												'jetpack'
											) }
										/>
									</div>
									<div className="jp-landing__plan-features-text">
										<h3 className="jp-landing__plan-features-title">
											{ __( 'Google Analytics', 'jetpack' ) }
										</h3>
										<p>
											{ __(
												'Complement WordPress.com’s stats with Google’s in-depth look at your visitors and traffic patterns.',
												'jetpack'
											) }
										</p>
										{ this.props.isModuleActivated( 'google-analytics' ) ? (
											<Button
												onClick={ this.handleButtonClickForTracking( 'configure_ga' ) }
												href={ getRedirectUrl( 'calypso-marketing-traffic', {
													site: this.props.siteRawUrl,
												} ) }
												compact
												rna
											>
												<ExternalLink>
													{ __( 'Configure Google Analytics', 'jetpack' ) }
												</ExternalLink>
											</Button>
										) : (
											<Button
												onClick={ this.activateGoogleAnalytics }
												disabled={ this.props.isActivatingModule( 'google-analytics' ) }
												compact
												rna
											>
												{ __( 'Activate Google Analytics', 'jetpack' ) }
											</Button>
										) }
									</div>
								</div>
							) }

						{ isPlanPremiumOrBetter &&
							'inactive' !== this.props.getModuleOverride( 'publicize' ) && (
								<div className="jp-landing__plan-features-card">
									<div className="jp-landing__plan-features-img">
										<img
											src={ imagePath + 'products/product-jetpack-social.svg' }
											className="jp-landing__plan-features-icon"
											alt={ __( 'A secure site, locked and protected by Jetpack', 'jetpack' ) }
										/>
									</div>
									<div className="jp-landing__plan-features-text">
										<h3 className="jp-landing__plan-features-title">
											{ __( 'Marketing automation', 'jetpack' ) }
										</h3>
										<p>
											{ __(
												'Schedule unlimited tweets, Facebook posts, and other social posts in advance.',
												'jetpack'
											) }
										</p>
										{ this.props.isModuleActivated( 'publicize' ) ? (
											<Button
												onClick={ this.handleButtonClickForTracking( 'schedule_posts' ) }
												href={ getRedirectUrl( 'calypso-edit-posts', {
													site: this.props.siteRawUrl,
												} ) }
												compact
												rna
											>
												<ExternalLink>{ __( 'Schedule posts', 'jetpack' ) }</ExternalLink>
											</Button>
										) : (
											<Button
												onClick={ this.activatePublicize }
												disabled={ this.props.isActivatingModule( 'publicize' ) }
												compact
												rna
											>
												{ __( 'Activate Jetpack Social', 'jetpack' ) }
											</Button>
										) }
									</div>
								</div>
							) }
					</div>
				);
				break;

			case 'is-free-plan':
			case 'is-backup-t0-plan':
			case 'is-backup-t1-plan':
			case 'is-backup-t2-plan':
			case 'is-search-plan':
			case 'is-jetpack-golden-token-plan':
			case 'is-free-search-plan':
			case 'offline':
			// DEPRECATED: Daily and Real-time variations will soon be retired.
			// Remove after all customers are migrated to new products.
			case 'is-daily-backup-plan':
			case 'is-realtime-backup-plan':
				planCard = (
					<div className="jp-landing__plan-features">
						{ jetpackBackupCard }
						{ this.props.hasInstantSearch && getSearchCard() }
						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + 'products/product-jetpack-protect.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'A secure site, locked and protected by Jetpack', 'jetpack' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Always-on security', 'jetpack' ) }
								</h3>
								<p>
									{ __(
										'Prevent login attacks, and get instant notifications when there’s an issue with your site.',
										'jetpack'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'free_security' ) }
									href={ getRedirectUrl( 'calypso-settings-security', {
										site: this.props.siteRawUrl,
									} ) }
									compact
									rna
								>
									<ExternalLink>{ __( 'Set up your site security', 'jetpack' ) }</ExternalLink>
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + 'products/product-jetpack-boost.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'A fast and performant website', 'jetpack' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Optimized performance', 'jetpack' ) }
								</h3>
								<p>
									{ __(
										'Load pages faster by serving your images from our global network of servers.',
										'jetpack'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'free_performance' ) }
									href={ this.props.siteAdminUrl + 'admin.php?page=jetpack#/performance' }
									compact
									rna
								>
									{ __( 'Make your site faster', 'jetpack' ) }
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + 'plans/jetpack.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'A wide variety of themes and tools to customize a site', 'jetpack' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Design the perfect website', 'jetpack' ) }
								</h3>
								<p>
									{ __(
										'Get access to professionally crafted themes offered on WordPress.com, & customize your site exactly how you like it.',
										'jetpack'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'free_themes' ) }
									href={ getRedirectUrl( 'calypso-themes', { site: this.props.siteRawUrl } ) }
									compact
									rna
								>
									<ExternalLink>{ __( 'Explore themes', 'jetpack' ) }</ExternalLink>
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + 'products/product-jetpack-social.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __(
										'Jetpack Stats showing an evolution in traffic and engagement',
										'jetpack'
									) }
								/>
							</div>
							{ 'inactive' !== this.props.getModuleOverride( 'publicize' ) && (
								<div className="jp-landing__plan-features-text">
									<h3 className="jp-landing__plan-features-title">
										{ __( 'Increase traffic to your site', 'jetpack' ) }
									</h3>
									<p>
										{ __(
											'Reach a wider audience by automatically sharing your posts on social media.',
											'jetpack'
										) }
									</p>
									{ this.props.isModuleActivated( 'publicize' ) ? (
										<Button
											onClick={ this.handleButtonClickForTracking( 'free_sharing' ) }
											href={ getRedirectUrl( 'calypso-marketing-connections', {
												site: this.props.siteRawUrl,
											} ) }
											compact
											rna
										>
											<ExternalLink>{ __( 'Start sharing', 'jetpack' ) }</ExternalLink>
										</Button>
									) : (
										<Button
											onClick={ this.activatePublicize }
											disabled={ this.props.isActivatingModule( 'publicize' ) }
											compact
											rna
										>
											{ __( 'Activate Jetpack Social', 'jetpack' ) }
										</Button>
									) }
								</div>
							) }
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + 'plans/jetpack.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __(
										'Interface showing a chronological list of changes and updates in a site',
										'jetpack'
									) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Site activity', 'jetpack' ) }
								</h3>
								<p>
									{ __(
										'View a chronological list of all the changes and updates to your site in an organized, readable way.',
										'jetpack'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'view_site_activity' ) }
									href={ getRedirectUrl( 'calypso-activity-log', { site: this.props.siteRawUrl } ) }
									compact
									rna
								>
									<ExternalLink>{ __( 'View your site activity', 'jetpack' ) }</ExternalLink>
								</Button>
							</div>
						</div>

						<div className="jp-landing__plan-features-card">
							<div className="jp-landing__plan-features-img">
								<img
									src={ imagePath + 'plans/jetpack.svg' }
									className="jp-landing__plan-features-icon"
									alt={ __( 'Chat bubbles representing getting in touch with support', 'jetpack' ) }
								/>
							</div>
							<div className="jp-landing__plan-features-text">
								<h3 className="jp-landing__plan-features-title">
									{ __( 'Support documentation', 'jetpack' ) }
								</h3>
								<p>
									{ __(
										'Need help? Learn about getting started, customizing your site, using advanced code snippets, and more.',
										'jetpack'
									) }
								</p>
								<Button
									onClick={ this.handleButtonClickForTracking( 'free_support_documentation' ) }
									href={ getRedirectUrl( 'jetpack-support' ) }
									compact
									rna
								>
									<ExternalLink>{ __( 'Search support docs', 'jetpack' ) }</ExternalLink>
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
			hasInstantSearch: siteHasFeature( state, 'instant-search' ),
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
