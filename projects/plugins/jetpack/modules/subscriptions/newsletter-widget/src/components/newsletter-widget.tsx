import { getRedirectUrl } from '@automattic/jetpack-components';
import '../style.scss';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink, Icon } from '@wordpress/components';
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { envelope, payment } from '@wordpress/icons';
import { TRACKS_EVENT_NAME_PREFIX } from '../constants';
import {
	buildJPRedirectSource,
	createTracksEventHandler,
	formatNumber,
	getSubscriberStatsUrl,
} from '../helpers';
import { SubscribersChart } from './subscribers-chart';
import type { SubscriberTotalsByDate } from '../types';

export interface NewsletterWidgetProps {
	site: string;
	adminUrl: string;
	isWpcomSite: boolean;
	emailSubscribers?: number;
	paidSubscribers?: number;
	allSubscribers?: number;
	subscriberTotalsByDate?: SubscriberTotalsByDate;
}

export const NewsletterWidget = ( {
	site,
	adminUrl,
	isWpcomSite,
	emailSubscribers = 0,
	paidSubscribers = 0,
	allSubscribers = 0,
	subscriberTotalsByDate = {},
}: NewsletterWidgetProps ) => {
	const showHeader = allSubscribers > 0 || paidSubscribers > 0;
	const showChart = Object.values( subscriberTotalsByDate ).some(
		day => day?.all >= 5 || day?.paid > 0
	);

	const { tracks } = useAnalytics();

	useEffect( () => {
		tracks.recordEvent( `${ TRACKS_EVENT_NAME_PREFIX }_view` );
	}, [ tracks ] );

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
									<a
										href={ getSubscriberStatsUrl( site, isWpcomSite, adminUrl ) }
										onClick={ createTracksEventHandler( tracks, 'all_subscribers_click' ) }
									>
										{ sprintf(
											//translators: %1$s is the total number of subscribers, %2$s is the number of email subscribers
											_n(
												'%1$s subscriber (%2$s via email)',
												'%1$s subscribers (%2$s via email)',
												allSubscribers,
												'jetpack'
											),
											formatNumber( allSubscribers ),
											formatNumber( emailSubscribers )
										) }
									</a>
								</span>
							</span>
						</span>
						<span className="newsletter-widget__stat-item">
							<span className="newsletter-widget__icon">
								<Icon icon={ payment } size={ 24 } />
							</span>
							<span className="newsletter-widget__stat-content">
								<span className="newsletter-widget__stat-label">
									<a
										href={ getSubscriberStatsUrl( site, isWpcomSite, adminUrl ) }
										onClick={ createTracksEventHandler( tracks, 'paid_subscribers_click' ) }
									>
										{ sprintf(
											//translators: %s is the number of paid subscribers
											_n( '%s paid subscriber', '%s paid subscribers', paidSubscribers, 'jetpack' ),
											formatNumber( paidSubscribers )
										) }
									</a>
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
							'Effortlessly turn posts into emails with our Newsletter feature-expand your reach, engage readers, and monetize your writing. No coding required. <link>Learn more</link>',
							'jetpack'
						),
						{
							link: (
								<ExternalLink
									onClick={ createTracksEventHandler( tracks, 'learn_more_click' ) }
									href={ getRedirectUrl(
										buildJPRedirectSource(
											'learn/courses/newsletters-101/wordpress-com-newsletter'
										)
									) }
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
						<li>
							<ExternalLink
								href={ getSubscriberStatsUrl( site, isWpcomSite, adminUrl ) }
								onClick={ createTracksEventHandler( tracks, 'view_stats_click' ) }
							>
								{ __( 'View subscriber stats', 'jetpack' ) }
							</ExternalLink>
						</li>
						<li>
							<ExternalLink
								href={ getRedirectUrl(
									buildJPRedirectSource( `subscribers/${ site }`, isWpcomSite ),
									{ anchor: 'add-subscribers' }
								) }
								onClick={ createTracksEventHandler( tracks, 'import_subscribers_click' ) }
							>
								{ __( 'Import subscribers', 'jetpack' ) }
							</ExternalLink>
						</li>
						<li>
							<ExternalLink
								href={ getRedirectUrl(
									buildJPRedirectSource( `subscribers/${ site }`, isWpcomSite )
								) }
								onClick={ createTracksEventHandler( tracks, 'manage_subscribers_click' ) }
							>
								{ __( 'Manage subscribers', 'jetpack' ) }
							</ExternalLink>
						</li>
						<li>
							<ExternalLink
								href={ getRedirectUrl(
									buildJPRedirectSource(
										`${ isWpcomSite ? 'earn' : 'monetize' }/${ site }`,
										isWpcomSite
									)
								) }
								onClick={ createTracksEventHandler( tracks, 'monetize_click' ) }
							>
								{ __( 'Monetize', 'jetpack' ) }
							</ExternalLink>
						</li>
						<li>
							{ isWpcomSite ? (
								<ExternalLink
									href={ getRedirectUrl(
										buildJPRedirectSource( `settings/newsletter/${ site }` )
									) }
									onClick={ createTracksEventHandler( tracks, 'newsletter_settings_click' ) }
								>
									{ __( 'Newsletter settings', 'jetpack' ) }
								</ExternalLink>
							) : (
								<a
									href={ `${ adminUrl }admin.php?page=jetpack#newsletter` }
									onClick={ createTracksEventHandler( tracks, 'newsletter_settings_click' ) }
								>
									{ __( 'Newsletter settings', 'jetpack' ) }
								</a>
							) }
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};
