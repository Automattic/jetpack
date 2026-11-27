import { formatCurrency } from '@automattic/number-formatters';
import { __, sprintf } from '@wordpress/i18n';
import { ButtonLink } from '@wordpress/ui';
import clsx from 'clsx';
import config from '../../../../compat/config';
import ConnectIcon from './connect-icon';
import FaqAccordion from './faq-accordion';

const blazeFire = config( 'images_url' ) + 'blaze-fire.svg';
const getStarted = config( 'images_url' ) + 'get-started.webp';
const wooGraphic = config( 'images_url' ) + 'more-followers.webp';

/**
 *
 */
export default function DisconnectedSite() {
	const connectUrl = config( 'connect_url' );
	const isWooStore = config.isEnabled( 'is_running_in_woo_site' );
	const minDailyBudget = formatCurrency( 5, 'USD' );

	return (
		<div className={ clsx( 'blaze-disconnected-site', { 'is-woo': isWooStore } ) }>
			{ /* Hero Section */ }
			<div className="blaze-disconnected-site__hero blaze-disconnected-site__section">
				<div className="blaze-disconnected-site__hero-content">
					<div className="blaze-disconnected-site__hero-body">
						<h1 className="blaze-disconnected-site__title">
							{ isWooStore
								? sprintf(
										/* translators: %(productName)s is the product name, Blaze Ads. */ __(
											'Create ads from your products in a snap with %(productName)s',
											'jetpack-blaze'
										),
										{ productName: 'Blaze Ads' }
									)
								: sprintf(
										/* translators: %(productName)s is the product name, Blaze Ads. */ __(
											'Create ads from your content in a snap with %(productName)s',
											'jetpack-blaze'
										),
										{ productName: 'Blaze Ads' }
									) }
							<span className="blaze-title-logo" aria-hidden="true">
								<img
									className="blaze-title-logo__icon"
									alt=""
									aria-hidden="true"
									src={ blazeFire }
								/>
							</span>
						</h1>
						<p className="blaze-disconnected-site__description">
							{ __(
								'The simplest way to promote your site to over 100 million users across WordPress and Tumblr.',
								'jetpack-blaze'
							) }
							<br />
							{ isWooStore
								? __( 'Turn your products into ads in just a few clicks.', 'jetpack-blaze' )
								: __( 'Turn your content into ads in just a few clicks.', 'jetpack-blaze' ) }
						</p>
						<ButtonLink className="blaze-disconnected-site__connect-button" href={ connectUrl }>
							<ConnectIcon />
							{ __( 'Connect now', 'jetpack-blaze' ) }
						</ButtonLink>
					</div>
				</div>
			</div>

			{ /* Features Section */ }
			<div className="blaze-disconnected-site__features blaze-disconnected-site__section">
				<div className="blaze-disconnected-site__features-graphic">
					<img src={ wooGraphic } alt="Blaze Ads" />
				</div>
				<div className="blaze-disconnected-site__features-body">
					<ul className="blaze-disconnected-site__features-list">
						{ isWooStore ? (
							<>
								<li>{ __( 'Drive traffic to your products', 'jetpack-blaze' ) }</li>
								<li>{ __( 'Boost sales and revenue', 'jetpack-blaze' ) }</li>
								<li>{ __( 'Reach a wider audience', 'jetpack-blaze' ) }</li>
								<li>{ __( 'Grow your customer base', 'jetpack-blaze' ) }</li>
							</>
						) : (
							<>
								<li>{ __( 'Grow your audience and subscribers', 'jetpack-blaze' ) }</li>
								<li>{ __( 'Tap into a network of 100 million users', 'jetpack-blaze' ) }</li>
								<li>{ __( 'Turn content into compelling ads', 'jetpack-blaze' ) }</li>
								<li>
									{ sprintf(
										/* translators: %(minDailyBudget)s is the minimum daily budget. */ __(
											'Start with just %(minDailyBudget)s per day',
											'jetpack-blaze'
										),
										{ minDailyBudget }
									) }
								</li>
							</>
						) }
					</ul>
					<p className="blaze-disconnected-site__features-description">
						{ isWooStore
							? sprintf(
									/* translators: %(productName)s is the product name, Blaze Ads. */ __(
										'%(productName)s is built for merchants who have a business to run and no time for endless settings. You can start driving traffic in just a few minutes.',
										'jetpack-blaze'
									),
									{ productName: 'Blaze Ads' }
								)
							: sprintf(
									/* translators: %(productName)s is the product name, Blaze Ads. */ __(
										'%(productName)s is built for creators who have stories to tell but no time for complex ad platforms. You can launch a campaign in just a few minutes.',
										'jetpack-blaze'
									),
									{ productName: 'Blaze Ads' }
								) }
					</p>
					<p className="blaze-disconnected-site__features-description">
						{ isWooStore
							? __(
									'Create ads directly from your product catalog or upload custom images to showcase your brand. The AI assistant helps draft compelling copy, while geographic and interest targeting connects you with the customers most likely to buy.',
									'jetpack-blaze'
								)
							: __(
									'Instantly turn your existing posts into ads, or upload custom images. The AI assistant helps refine your message, while interest targeting ensures you connect with the people who matter most.',
									'jetpack-blaze'
								) }
					</p>
				</div>
			</div>

			{ /* Three Steps Section */ }
			<div className="blaze-disconnected-site__steps blaze-disconnected-site__section">
				<div className="blaze-disconnected-site__steps-grid">
					<div className="blaze-disconnected-site__step-card">
						<div className="blaze-disconnected-site__step-card-number">1</div>
						<h3 className="blaze-disconnected-site__step-card-title">
							{ isWooStore
								? __( 'Promote your products.', 'jetpack-blaze' )
								: __( 'Choose your best content.', 'jetpack-blaze' ) }
						</h3>
						<p className="blaze-disconnected-site__step-card-text">
							{ isWooStore
								? __(
										'Select items directly from your inventory and transform them into ads with a single click.',
										'jetpack-blaze'
									)
								: __(
										'Transform your top-performing posts and pages into ads with a single click.',
										'jetpack-blaze'
									) }
						</p>
					</div>

					<div className="blaze-disconnected-site__step-card">
						<div className="blaze-disconnected-site__step-card-number">2</div>
						<h3 className="blaze-disconnected-site__step-card-title">
							{ isWooStore
								? __( 'Find the right customers.', 'jetpack-blaze' )
								: __( 'Find your ideal crowd.', 'jetpack-blaze' ) }
						</h3>
						<p className="blaze-disconnected-site__step-card-text">
							{ isWooStore
								? __(
										'We present your products to interested shoppers right where they are browsing.',
										'jetpack-blaze'
									)
								: __(
										'We display your stories where interested users are already looking to discover new content.',
										'jetpack-blaze'
									) }
						</p>
					</div>

					<div className="blaze-disconnected-site__step-card">
						<div className="blaze-disconnected-site__step-card-number">3</div>
						<h3 className="blaze-disconnected-site__step-card-title">
							{ isWooStore
								? __( 'Drive results.', 'jetpack-blaze' )
								: __( 'Experience growth.', 'jetpack-blaze' ) }
						</h3>
						<p className="blaze-disconnected-site__step-card-text">
							{ isWooStore
								? sprintf(
										/* translators: %(minDailyBudget)s is the minimum daily budget. */ __(
											'See the impact on your store traffic for just %(minDailyBudget)s per day and gain the momentum you need.',
											'jetpack-blaze'
										),
										{ minDailyBudget }
									)
								: sprintf(
										/* translators: %(minDailyBudget)s is the minimum daily budget. */ __(
											'Start building momentum and traffic for just %(minDailyBudget)s per day.',
											'jetpack-blaze'
										),
										{ minDailyBudget }
									) }
						</p>
					</div>
				</div>
			</div>

			{ /* FAQ Section */ }
			<div className="blaze-disconnected-site__faq blaze-disconnected-site__section">
				<h2 className="blaze-disconnected-site__section-title">
					{ __( 'Frequently asked questions', 'jetpack-blaze' ) }
				</h2>
				<FaqAccordion
					question={ sprintf(
						/* translators: %(productName)s is the product name, Blaze Ads. */ __(
							'How does %(productName)s differ from organic traffic growth?',
							'jetpack-blaze'
						),
						{ productName: 'Blaze Ads' }
					) }
					answer={ sprintf(
						/* translators: %(productName)s is the product name, Blaze Ads. */ __(
							'Organic growth is essential but often slow. %(productName)s amplifies your reach immediately. Instead of waiting for users to find you via search, it proactively places your content or products in the feeds of users who are already reading about related topics. It is designed to supplement your SEO efforts with immediate visibility.',
							'jetpack-blaze'
						),
						{ productName: 'Blaze Ads' }
					) }
				/>
				<FaqAccordion
					question={ __( 'Do I need design skills to create ad creatives?', 'jetpack-blaze' ) }
					answer={ __(
						'No. The tool automates the creative process by pulling the featured image and title from your existing post or product page. You have full control to edit the text or crop the image within the dashboard, but you do not need external design software to launch a professional-looking campaign.',
						'jetpack-blaze'
					) }
				/>
				<FaqAccordion
					question={ __( 'What can I expect from a minimum budget?', 'jetpack-blaze' ) }
					answer={ sprintf(
						/* translators: %(minDailyBudget)s is the minimum daily budget. */ __(
							'Campaigns start at %(minDailyBudget)s per day. While higher budgets reach more people, the minimum spend is sufficient to generate thousands of impressions. This allows you to cost-effectively test different products or headlines to see what converts before committing to a larger budget.',
							'jetpack-blaze'
						),
						{ minDailyBudget }
					) }
				/>
				{ isWooStore && (
					<FaqAccordion
						question={ __( 'How does this integrate with WooCommerce?', 'jetpack-blaze' ) }
						answer={ sprintf(
							/* translators: %(productName)s is the product name, Blaze Ads. */ __(
								'%(productName)s is fully compatible with WooCommerce. You\'ll see all of your inventory, allowing you to select specific products to promote. You can target audiences based on interests (e.g., "Fashion," "Tech," "DIY"), sending high-intent traffic directly to your product.',
								'jetpack-blaze'
							),
							{ productName: 'Blaze Ads' }
						) }
					/>
				) }
				<FaqAccordion
					question={ __( 'Where exactly do the ads appear?', 'jetpack-blaze' ) }
					answer={ __(
						'Your ads run as "Sponsored Content" across the WordPress.com and Tumblr networks, reaching a potential audience of over 100 million users. The ads appear natively within user feeds or website content that users are actively consuming.',
						'jetpack-blaze'
					) }
				/>
				<FaqAccordion
					question={ __( 'Why is a WordPress.com connection required?', 'jetpack-blaze' ) }
					answer={ __(
						'The connection provides the necessary infrastructure for ad delivery and billing. It authenticates your site to broadcast content across the network and ensures secure payment processing. If you do not have an account, the setup process will guide you through creating one quickly.',
						'jetpack-blaze'
					) }
				/>
			</div>

			{ /* Connection Section */ }
			<div className="blaze-disconnected-site__connect blaze-disconnected-site__section">
				<div className="blaze-disconnected-site__connect-content">
					<div className="blaze-disconnected-site__connect-graphic">
						<img src={ getStarted } alt="" />
					</div>
					<div className="blaze-disconnected-site__connect-body">
						<h4 className="blaze-disconnected-site__connect-title">
							{ __( 'Ready to get started?', 'jetpack-blaze' ) }
							<span className="blaze-title-logo" aria-hidden="true">
								<img
									className="blaze-title-logo__icon"
									alt=""
									aria-hidden="true"
									src={ blazeFire }
								/>
							</span>
						</h4>
						<p className="blaze-disconnected-site__connect-description">
							{ __(
								'Connect your site now to unlock the dashboard and start your first campaign.',
								'jetpack-blaze'
							) }
						</p>
						<ButtonLink className="blaze-disconnected-site__connect-button" href={ connectUrl }>
							<ConnectIcon />
							{ __( 'Connect now', 'jetpack-blaze' ) }
						</ButtonLink>
					</div>
				</div>
			</div>
		</div>
	);
}
