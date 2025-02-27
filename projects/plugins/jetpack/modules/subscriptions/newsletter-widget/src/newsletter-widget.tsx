import './style.scss';
import { Icon } from '@wordpress/components';
import { envelope, payment } from '@wordpress/icons';

interface NewsletterWidgetProps {
	hostname: string;
	adminUrl: string;
	emailSubscribers?: number;
	paidSubscribers?: number;
}

const WPCOM_BASE = 'https://wordpress.com';

export const NewsletterWidget = ( {
	hostname,
	adminUrl,
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
								<a href={ `${ WPCOM_BASE }/stats/subscribers/${ hostname }` }>
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
								<a href={ `${ WPCOM_BASE }/stats/subscribers/${ hostname }` }>paid subscriptions</a>
							</span>
						</span>
					</span>
				</div>
			</div>
			<div className="newsletter-widget__footer">
				<p className="newsletter-widget__footer-msg">
					Effortlessly turn posts into emails with our Newsletter feature-expand your reach, engage
					readers, and monetize your writing. No coding required.{ ' ' }
					<a href={ `${ WPCOM_BASE }/learn/courses/newsletters-101/wordpress-com-newsletter/` }>
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
							<a href={ `${ WPCOM_BASE }/stats/subscribers/${ hostname }` }>
								View subscriber stats
							</a>
						</li>
						<li>
							<a href={ `${ WPCOM_BASE }/subscribers/${ hostname }` }>Import subscribers</a>
						</li>
						<li>
							<a href={ `${ WPCOM_BASE }/subscribers/${ hostname }` }>Manage subscribers</a>
						</li>
						<li>
							<a href={ `${ WPCOM_BASE }/earn/${ hostname }` }>Monetize</a>
						</li>
						<li>
							<a href={ `${ WPCOM_BASE }/settings/newsletter/${ hostname }` }>
								Newsletter settings
							</a>
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};
