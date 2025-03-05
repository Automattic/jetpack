import { getRedirectUrl } from '@automattic/jetpack-components';
import '../style.scss';
import { Icon } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { envelope, payment } from '@wordpress/icons';
import { SubscribersChart } from './subscribers-chart';
import type { DailyCount } from '../types';

interface NewsletterWidgetProps {
	site: string;
	adminUrl: string;
	isWpcomSite: boolean;
	emailSubscribers?: number;
	paidSubscribers?: number;
	countsByDay?: Record< string, DailyCount >;
}

/**
 * Helper function to build the Jetpack redirect source URL.
 * @param url         - The url to redirect to. Note: it can only be to a whitelisted domain, and query params and anchors must be passed to getRedirectUrl as arguments.
 * @param isWpcomSite - The the site on the WordPress.com platform. Simple or WoA.
 * @return The URL that can be passed to the getRedirectUrl function.
 * @example
 * const site = 'example.wordpress.com';
 * const redirectUrl = buildJPRedirectSource( `subscribers/${ site }`, true );
 *
 * <a href={ getRedirectUrl( redirectUrl ) }>Subscriber</a>;
 */
const buildJPRedirectSource = ( url: string, isWpcomSite: boolean = true ) => {
	const host = isWpcomSite ? 'wordpress.com' : 'cloud.jetpack.com';
	return `https://${ host }/${ url }`;
};

export const NewsletterWidget = ( {
	site,
	adminUrl,
	isWpcomSite,
	emailSubscribers,
	paidSubscribers,
	countsByDay,
}: NewsletterWidgetProps ) => {
	return (
		<div className="newsletter-widget">
			<div className="newsletter-widget__header">
				<div className="newsletter-widget__stats">
					<span className="newsletter-widget__stat-item">
						<span className="newsletter-widget__icon">
							<Icon icon={ envelope } size={ 24 } />
						</span>
						<span className="newsletter-widget__stat-content">
							<span className="newsletter-widget__stat-label">
								<a
									href={
										isWpcomSite
											? getRedirectUrl( buildJPRedirectSource( `stats/subscribers/${ site }` ) )
											: `${ adminUrl }admin.php?page=stats#!/stats/subscribers/${ site }`
									}
								>
									{ sprintf(
										//translators: %s is the number of email subscribers
										__( '%s email subscriptions', 'jetpack' ),
										emailSubscribers
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
									href={
										isWpcomSite
											? getRedirectUrl( buildJPRedirectSource( `stats/subscribers/${ site }` ) )
											: `${ adminUrl }admin.php?page=stats#!/stats/subscribers/${ site }`
									}
								>
									{ sprintf(
										//translators: %s is the number of paid subscribers
										__( '%s paid subscriptions', 'jetpack' ),
										paidSubscribers
									) }
								</a>
							</span>
						</span>
					</span>
				</div>
			</div>
			<div className="newsletter-widget__chart">
				<h3 className="newsletter-widget__heading">{ __( 'Total Subscribers', 'jetpack' ) }</h3>
				<SubscribersChart countsByDay={ countsByDay } />
			</div>
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
							<a
								href={
									isWpcomSite
										? getRedirectUrl( buildJPRedirectSource( `stats/subscribers/${ site }` ) )
										: `${ adminUrl }admin.php?page=stats#!/stats/subscribers/${ site }`
								}
							>
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
