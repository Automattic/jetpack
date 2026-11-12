import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import '../style.scss';
import { Icon } from '@wordpress/components';
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { envelope, payment } from '@wordpress/icons';
import { TRACKS_EVENT_NAME_PREFIX } from '../constants';
import {
	buildJPRedirectSource,
	formatNumber,
	getSubscriberStatsUrl,
	createTracksEventHandler,
} from '../helpers';
import { DashboardLink } from './dashboard-link';
import { SubscribersChart } from './subscribers-chart';
import type { SubscriberTotalsByDate } from '../types';

export interface NewsletterWidgetProps {
	site: string;
	adminUrl: string;
	isWpcomSite: boolean;
	isStatsModuleActive?: boolean;
	emailSubscribers?: number;
	paidSubscribers?: number;
	allSubscribers?: number;
	subscriberTotalsByDate?: SubscriberTotalsByDate;
	showHeader?: boolean;
	showChart?: boolean;
	newsletterSettingsUrl?: string;
}

export const NewsletterWidget = ( {
	site,
	adminUrl,
	isWpcomSite,
	isStatsModuleActive,
	emailSubscribers = 0,
	paidSubscribers = 0,
	allSubscribers = 0,
	subscriberTotalsByDate = {},
	showHeader,
	showChart,
	newsletterSettingsUrl,
}: NewsletterWidgetProps ) => {
	const { tracks } = useAnalytics();

	useEffect( () => {
		tracks.recordEvent( `${ TRACKS_EVENT_NAME_PREFIX }_view` );
	}, [ tracks ] );

	// Null only where the dashboard is the analytics UI and this user cannot open
	// it: the counts still render, just not as links.
	const subscriberStatsUrl = getSubscriberStatsUrl( site, adminUrl );

	const subscribersText = sprintf(
		//translators: %1$s is the total number of subscribers, %2$s is the number of email subscribers
		_n(
			'%1$s subscriber (%2$s via email)',
			'%1$s subscribers (%2$s via email)',
			allSubscribers,
			'jetpack'
		),
		formatNumber( allSubscribers ),
		formatNumber( emailSubscribers )
	);

	const paidSubscribersText = sprintf(
		//translators: %s is the number of paid subscribers
		_n( '%s paid subscriber', '%s paid subscribers', paidSubscribers, 'jetpack' ),
		formatNumber( paidSubscribers )
	);

	return (
		<div className="newsletter-widget">
			{ showHeader && (
				<div className="newsletter-widget__header">
					<div className="newsletter-widget__stats">
						<span className="newsletter-widget__stat-item">
							<span className="newsletter-widget__icon">
								<Icon icon={ envelope } size={ 24 } />
							</span>
							<span className="newsletter-widget__stat-content">
								<span className="newsletter-widget__stat-label">
									{ subscriberStatsUrl ? (
										<DashboardLink
											internal
											href={ subscriberStatsUrl }
											eventName="all_subscribers_click"
											tracks={ tracks }
										>
											{ subscribersText }
										</DashboardLink>
									) : (
										subscribersText
									) }
								</span>
							</span>
						</span>
						<span className="newsletter-widget__stat-item">
							<span className="newsletter-widget__icon">
								<Icon icon={ payment } size={ 24 } />
							</span>
							<span className="newsletter-widget__stat-content">
								<span className="newsletter-widget__stat-label">
									{ subscriberStatsUrl ? (
										<DashboardLink
											internal
											href={ subscriberStatsUrl }
											eventName="paid_subscribers_click"
											tracks={ tracks }
										>
											{ paidSubscribersText }
										</DashboardLink>
									) : (
										paidSubscribersText
									) }
								</span>
							</span>
						</span>
					</div>
				</div>
			) }
			{ showChart && (
				<div className="newsletter-widget__chart">
					<h3 className="newsletter-widget__heading">{ __( 'Total Subscribers', 'jetpack' ) }</h3>
					<SubscribersChart subscriberTotalsByDate={ subscriberTotalsByDate } />
				</div>
			) }
			<div className="newsletter-widget__footer">
				<p className="newsletter-widget__footer-msg">
					{ createInterpolateElement(
						__(
							'Effortlessly turn posts into emails with our Newsletter feature. Expand your reach, engage readers, and monetize your writing. No coding required. <link>Learn more</link>',
							'jetpack'
						),
						{
							link: (
								<DashboardLink
									internal={ isWpcomSite }
									href={
										isWpcomSite
											? 'https://wordpress.com/learn/courses/newsletters-101/wordpress-com-newsletter'
											: 'https://jetpack.com/support/newsletter'
									}
									eventName="learn_more_click"
									tracks={ tracks }
								/>
							),
						}
					) }
				</p>
				<div>
					<h3 className="newsletter-widget__heading">{ __( 'Quick Links', 'jetpack' ) }</h3>
					<ul className="newsletter-widget__footer-list">
						<li>
							<a
								href={ `${ adminUrl }post-new.php` }
								onClick={ createTracksEventHandler( tracks, 'publish_post_click' ) }
							>
								{ __( 'Publish your next post', 'jetpack' ) }
							</a>
						</li>
						{ isStatsModuleActive && subscriberStatsUrl && (
							<li>
								<DashboardLink
									internal
									href={ subscriberStatsUrl }
									eventName="view_stats_click"
									tracks={ tracks }
								>
									{ __( 'View subscriber stats', 'jetpack' ) }
								</DashboardLink>
							</li>
						) }
						<li>
							<DashboardLink
								internal={ isWpcomSite }
								href={ getRedirectUrl(
									buildJPRedirectSource( `subscribers/${ site }`, isWpcomSite ),
									{
										anchor: 'add-subscribers',
									}
								) }
								eventName="import_subscribers_click"
								tracks={ tracks }
							>
								{ __( 'Import subscribers', 'jetpack' ) }
							</DashboardLink>
						</li>
						<li>
							<DashboardLink
								internal={ isWpcomSite }
								href={ getRedirectUrl(
									buildJPRedirectSource( `subscribers/${ site }`, isWpcomSite )
								) }
								eventName="manage_subscribers_click"
								tracks={ tracks }
							>
								{ __( 'Manage subscribers', 'jetpack' ) }
							</DashboardLink>
						</li>
						<li>
							<DashboardLink
								internal={ isWpcomSite }
								href={ getRedirectUrl(
									buildJPRedirectSource(
										`${ isWpcomSite ? 'earn' : 'monetize' }/${ site }`,
										isWpcomSite
									)
								) }
								eventName="monetize_click"
								tracks={ tracks }
							>
								{ __( 'Monetize', 'jetpack' ) }
							</DashboardLink>
						</li>
						{ newsletterSettingsUrl && (
							<li>
								<DashboardLink
									internal
									href={ newsletterSettingsUrl }
									eventName="newsletter_settings_click"
									tracks={ tracks }
								>
									{ __( 'Newsletter settings', 'jetpack' ) }
								</DashboardLink>
							</li>
						) }
					</ul>
				</div>
			</div>
		</div>
	);
};
