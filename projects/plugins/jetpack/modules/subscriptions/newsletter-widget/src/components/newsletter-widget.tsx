import { getRedirectUrl } from '@automattic/jetpack-components';
import '../style.scss';
import { Icon } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { envelope, payment } from '@wordpress/icons';
import { buildJPRedirectSource, formatNumber, getSubscriberStatsUrl } from '../helpers';
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
									<a href={ getSubscriberStatsUrl( site, isWpcomSite, adminUrl ) }>
										{ sprintf(
											//translators: %1$s is the total number of subscribers, %2$s is the number of email subscribers
											__( '%1$s subscribers (%2$s via email)', 'jetpack' ),
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
									<a href={ getSubscriberStatsUrl( site, isWpcomSite, adminUrl ) }>
										{ sprintf(
											//translators: %s is the number of paid subscribers
											__( '%s paid subscriptions', 'jetpack' ),
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
								<a
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
							<a href={ `${ adminUrl }edit.php` }>{ __( 'Publish your next post', 'jetpack' ) }</a>
						</li>
						<li>
							<a href={ getSubscriberStatsUrl( site, isWpcomSite, adminUrl ) }>
								{ __( 'View subscriber stats', 'jetpack' ) }
							</a>
						</li>
						<li>
							<a
								href={ getRedirectUrl(
									buildJPRedirectSource( `subscribers/${ site }`, isWpcomSite ),
									{ anchor: 'add-subscribers' }
								) }
							>
								{ __( 'Import subscribers', 'jetpack' ) }
							</a>
						</li>
						<li>
							<a
								href={ getRedirectUrl(
									buildJPRedirectSource( `subscribers/${ site }`, isWpcomSite )
								) }
							>
								{ __( 'Manage subscribers', 'jetpack' ) }
							</a>
						</li>
						<li>
							<a
								href={ getRedirectUrl(
									buildJPRedirectSource(
										`${ isWpcomSite ? 'earn' : 'monetize' }/${ site }`,
										isWpcomSite
									)
								) }
							>
								{ __( 'Monetize', 'jetpack' ) }
							</a>
						</li>
						<li>
							<a
								href={
									isWpcomSite
										? getRedirectUrl( buildJPRedirectSource( `settings/newsletter/${ site }` ) )
										: `${ adminUrl }admin.php?page=jetpack#newsletter`
								}
							>
								{ __( 'Newsletter settings', 'jetpack' ) }
							</a>
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};
