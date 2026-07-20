import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import { getSiteOfflineMode } from 'state/connection';
import { getSiteAdminUrl } from 'state/initial-state';

import './style.scss';

const STUDIO_URL = 'https://developer.wordpress.com/studio/';
const STUDIO_PREVIEW_SITES_URL =
	'https://developer.wordpress.com/docs/developer-tools/studio/preview-sites/';

/**
 * Human-readable names for the local development environments we can detect.
 */
const LOCAL_ENVIRONMENT_NAMES = {
	studio: 'WordPress Studio',
	ddev: 'DDEV',
	lando: 'Lando',
	docksal: 'Docksal',
	serverpress: 'ServerPress',
};

/**
 * Jetpack pages that render with sample data (or are fully functional) in Offline
 * Mode, rather than being hidden. Shown on the landing page so there's somewhere
 * to click through to besides Settings.
 */
const EXPLORE_LINKS = [
	{
		page: 'my-jetpack',
		icon: 'plugins',
		title: __( 'My Jetpack', 'jetpack' ),
		description: __( 'Overview of every Jetpack product on this site.', 'jetpack' ),
	},
	{
		page: 'stats',
		icon: 'stats-alt',
		title: __( 'Stats', 'jetpack' ),
		description: __( 'Traffic insights, shown here with sample numbers.', 'jetpack' ),
	},
	{
		page: 'jetpack-search',
		icon: 'search',
		title: __( 'Search', 'jetpack' ),
		description: __( 'Fast, relevant site search, previewed with sample results.', 'jetpack' ),
	},
	{
		page: 'jetpack-social',
		icon: 'share',
		title: __( 'Social', 'jetpack' ),
		description: __( 'Auto-share posts to social media; settings work locally.', 'jetpack' ),
	},
	{
		page: 'jetpack-videopress',
		icon: 'video',
		title: __( 'VideoPress', 'jetpack' ),
		description: __( 'Ad-free video hosting, shown here with sample stats.', 'jetpack' ),
	},
	{
		page: 'jetpack-newsletter',
		icon: 'mail',
		title: __( 'Newsletter', 'jetpack' ),
		description: __( 'Email your posts to subscribers; settings work locally.', 'jetpack' ),
	},
	{
		page: 'jetpack-ai',
		icon: 'star',
		title: __( 'AI', 'jetpack' ),
		description: __( 'Control how AI agents interact with this site.', 'jetpack' ),
	},
];

export class OfflineModePage extends Component {
	static displayName = 'OfflineModePage';

	/**
	 * Short clause describing *why* local development mode is on, meant to lead
	 * off one sentence (capitalized, no trailing period) rather than stand
	 * alone as a separate status line -- see how `render()` uses it.
	 *
	 * @return {string} The leading clause.
	 */
	getReason() {
		const offlineMode = this.props.siteOfflineMode;

		if ( ! offlineMode ) {
			return __( 'Local development mode is on', 'jetpack' );
		}
		if ( offlineMode.url ) {
			return __( 'Jetpack detected a local development environment', 'jetpack' );
		}
		if ( offlineMode.constant ) {
			return sprintf(
				/* translators: %s: a PHP constant name, such as JETPACK_DEV_DEBUG. */
				__( 'The %s constant is defined', 'jetpack' ),
				'JETPACK_DEV_DEBUG'
			);
		}
		if ( offlineMode.wpLocalConstant ) {
			return sprintf(
				/* translators: %s: a PHP constant name, such as WP_LOCAL_DEV. */
				__( 'The %s constant is defined', 'jetpack' ),
				'WP_LOCAL_DEV'
			);
		}
		if ( offlineMode.filter ) {
			return sprintf(
				/* translators: %s: a WordPress filter name. */
				__( 'The %s filter is active', 'jetpack' ),
				'jetpack_offline_mode'
			);
		}
		if ( offlineMode.option ) {
			return sprintf(
				/* translators: %s: a WordPress option name. */
				__( 'The %s option is active', 'jetpack' ),
				'jetpack_offline_mode'
			);
		}
		return __( 'Local development mode is on', 'jetpack' );
	}

	renderNoInternetNotice() {
		const offlineMode = this.props.siteOfflineMode;

		// Only warn when the connectivity check ran and failed.
		if ( ! offlineMode || false !== offlineMode.hasInternet ) {
			return null;
		}

		return (
			<Card className="jp-offline-mode__no-internet">
				<Gridicon icon="link-break" size={ 24 } />
				<div>
					<h3>{ __( 'No internet connection detected', 'jetpack' ) }</h3>
					<p>
						{ __(
							'Your site cannot reach the internet right now. Features and links that rely on external services will not work until you are back online.',
							'jetpack'
						) }
					</p>
				</div>
			</Card>
		);
	}

	renderExploreSection() {
		return (
			<Card className="jp-offline-mode__explore">
				<Gridicon icon="layout-blocks" size={ 24 } />
				<div>
					<h3>{ __( 'Explore your dashboard', 'jetpack' ) }</h3>
					<p>{ __( 'These pages work locally, mostly with sample data:', 'jetpack' ) }</p>
					<ul className="jp-offline-mode__explore-list">
						{ EXPLORE_LINKS.map( link => (
							<li key={ link.page }>
								<a href={ this.props.siteAdminUrl + 'admin.php?page=' + link.page }>
									<Gridicon icon={ link.icon } size={ 18 } />
									<span className="jp-offline-mode__explore-link-text">
										<strong>{ link.title }</strong>
										<span>{ link.description }</span>
									</span>
								</a>
							</li>
						) ) }
					</ul>
					<p className="jp-offline-mode__explore-footnote">
						{ createInterpolateElement(
							__(
								'Local-only features (contact forms, custom CSS, lazy images, and more) keep working without a connection. <a>Manage them in Settings</a>.',
								'jetpack'
							),
							{
								a: <a href={ this.props.siteAdminUrl + 'admin.php?page=jetpack#/settings' } />,
							}
						) }
					</p>
				</div>
			</Card>
		);
	}

	renderStudioSection() {
		const offlineMode = this.props.siteOfflineMode;
		const isStudio = offlineMode && 'studio' === offlineMode.localEnvironment;

		if ( isStudio ) {
			return (
				<Card className="jp-offline-mode__studio jp-offline-mode__studio--slim">
					<Gridicon icon="share" size={ 20 } />
					<p>
						{ createInterpolateElement(
							__(
								'Want to share this work in progress? Studio’s <a>Preview Sites</a> give you a connectable, hosted copy.',
								'jetpack'
							),
							{
								a: (
									<a href={ STUDIO_PREVIEW_SITES_URL } target="_blank" rel="noopener noreferrer" />
								),
							}
						) }
					</p>
				</Card>
			);
		}

		return (
			<Card className="jp-offline-mode__studio jp-offline-mode__studio--slim jp-offline-mode__studio--promo">
				<Gridicon icon="computer" size={ 20 } />
				<p>
					{ createInterpolateElement(
						__(
							'Developing locally? <a>WordPress Studio</a> is a free app whose Preview Sites let Jetpack fully connect.',
							'jetpack'
						),
						{
							a: <a href={ STUDIO_URL } target="_blank" rel="noopener noreferrer" />,
						}
					) }
				</p>
			</Card>
		);
	}

	render() {
		const offlineMode = this.props.siteOfflineMode;
		const environmentName =
			offlineMode && LOCAL_ENVIRONMENT_NAMES[ offlineMode.localEnvironment ]
				? LOCAL_ENVIRONMENT_NAMES[ offlineMode.localEnvironment ]
				: null;

		return (
			<div className="jp-offline-mode" aria-live="polite">
				{ this.renderNoInternetNotice() }

				<Card className="jp-offline-mode__header">
					<Gridicon icon="info-outline" size={ 24 } />
					<div>
						<h2>
							{ environmentName
								? sprintf(
										/* translators: %s: the name of a local development tool, such as WordPress Studio. */
										__( 'Local development mode (%s)', 'jetpack' ),
										environmentName
								  )
								: __( 'Local development mode', 'jetpack' ) }
						</h2>
						<p>
							{ createInterpolateElement(
								sprintf(
									/* translators: %s: a short clause explaining why local development mode turned on, e.g. "Jetpack detected a local development environment". */
									__(
										'%s, so features needing a live connection, like backups, real analytics, and video uploads, aren’t available. Most of the dashboard still works below, with sample data standing in. <a>Learn more</a>.',
										'jetpack'
									),
									this.getReason()
								),
								{
									a: (
										<a
											href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
											target="_blank"
											rel="noopener noreferrer"
										/>
									),
								}
							) }
						</p>
					</div>
				</Card>

				{ this.renderExploreSection() }

				{ this.renderStudioSection() }
			</div>
		);
	}
}

export default connect( state => {
	return {
		siteOfflineMode: getSiteOfflineMode( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
	};
} )( OfflineModePage );
