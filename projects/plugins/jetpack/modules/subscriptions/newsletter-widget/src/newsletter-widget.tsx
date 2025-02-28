import { getRedirectUrl } from '@automattic/jetpack-components';
import './style.scss';
import { Icon } from '@wordpress/components';
import { envelope, payment } from '@wordpress/icons';

interface NewsletterWidgetProps {
	site: string;
	adminUrl: string;
	isWpcomSite: boolean;
	emailSubscribers?: number;
	paidSubscribers?: number;
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
}: NewsletterWidgetProps ) => {
	return (
		<div className="newsletter-widget">
			<div className="newsletter-widget__header">
				<div className="newsletter-widget__stats">
					<span className="newsletter-widget__stat-item newsletter-widget__stat-item--left">
						<span className="newsletter-widget__icon">
							<Icon icon={ envelope } size={ 20 } />
						</span>
						<span className="newsletter-widget__stat-content">
							<span className="newsletter-widget__stat-number">{ emailSubscribers }</span>
							<span className="newsletter-widget__stat-label">
								<a
									href={
										isWpcomSite
											? getRedirectUrl( buildJPRedirectSource( `stats/subscribers/${ site }` ) )
											: `${ adminUrl }admin.php?page=stats#!/stats/subscribers/${ site }`
									}
								>
									email subscriptions
								</a>
							</span>
						</span>
					</span>
					<span className="newsletter-widget__stat-item newsletter-widget__stat-item--right">
						<span className="newsletter-widget__icon">
							<Icon icon={ payment } size={ 20 } />
						</span>
						<span className="newsletter-widget__stat-content">
							<span className="newsletter-widget__stat-number">{ paidSubscribers }</span>
							<span className="newsletter-widget__stat-label">
								<a
									href={
										isWpcomSite
											? getRedirectUrl( buildJPRedirectSource( `stats/subscribers/${ site }` ) )
											: `${ adminUrl }admin.php?page=stats#!/stats/subscribers/${ site }`
									}
								>
									paid subscriptions
								</a>
							</span>
						</span>
					</span>
				</div>
			</div>
			<div className="newsletter-widget__footer">
				<p className="newsletter-widget__footer-msg">
					Effortlessly turn posts into emails with our Newsletter feature-expand your reach, engage
					readers, and monetize your writing. No coding required.{ ' ' }
					<a
						href={ getRedirectUrl(
							buildJPRedirectSource( 'learn/courses/newsletters-101/wordpress-com-newsletter' )
						) }
					>
						Learn more
					</a>
				</p>
				<div>
					<h3>Quick Links</h3>
					<ul className="newsletter-widget__footer-list">
						<li>
							<a href={ `${ adminUrl }edit.php` }>Publish your next post</a>
						</li>
						<li>
							<a
								href={
									isWpcomSite
										? getRedirectUrl( buildJPRedirectSource( `stats/subscribers/${ site }` ) )
										: `${ adminUrl }admin.php?page=stats#!/stats/subscribers/${ site }`
								}
							>
								View subscriber stats
							</a>
						</li>
						<li>
							<a
								href={ getRedirectUrl(
									buildJPRedirectSource( `subscribers/${ site }`, isWpcomSite )
								) }
							>
								Import subscribers
							</a>
						</li>
						<li>
							<a
								href={ getRedirectUrl(
									buildJPRedirectSource( `subscribers/${ site }`, isWpcomSite )
								) }
							>
								Manage subscribers
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
								Monetize
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
								Newsletter settings
							</a>
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};
