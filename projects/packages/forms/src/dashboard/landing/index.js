import { __ } from '@wordpress/i18n';
import Details from '../components/details';
import Layout from '../components/layout';
import { config } from '../index';
import AkismetSVG from './akismet-svg';
import CheckSVG from './check-svg';
import CloseSVG from './close-svg';
import ExportSVG from './export-svg';
import NotificationsSVG from './notifications-svg';
import WordpressSVG from './wordpress-svg';

import './style.scss';

const LandingPage = () => {
	const ASSETS_URL = config( 'pluginAssetsURL' );

	return (
		<Layout className="jp-forms__landing">
			<section className="jp-forms__landing-section bg-white-off">
				<div className="jp-forms__landing-content">
					<h1 className="mb-2">{ __( 'Building forms made easy', 'jetpack-forms' ) }</h1>
					<h4 className="mb-8">
						{ __( 'Free, flexible, fast and it works out of the box.', 'jetpack-forms' ) }
					</h4>
					<button className="button button-primary mb-6">
						{ __( 'Create your first form', 'jetpack-forms' ) }
					</button>
					<img
						src={ `${ ASSETS_URL }/images/responses-inbox.png` }
						className="jp-forms__teaser-video"
						alt={ __( 'Jetpack Forms teaser video', 'jetpack-forms' ) }
					/>
				</div>
			</section>
			<section className="jp-forms__landing-section">
				<div className="jp-forms__landing-content">
					<h1>{ __( 'Start with one of many beautiful form patterns.', 'jetpack-forms' ) }</h1>
					<h1 className="mb-12">{ __( 'Customize to your needs.', 'jetpack-forms' ) }</h1>
					<div className="jp-forms__patterns-grid mb-8">
						<div className="jp-forms__pattern-item">
							<img
								src={ `${ ASSETS_URL }/images/contact-form.png` }
								alt={ __( 'Contact Form', 'jetpack-forms' ) }
							/>
							<span>{ __( 'Contact form', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<img
								src={ `${ ASSETS_URL }/images/booking-form.png` }
								alt={ __( 'Booking Form', 'jetpack-forms' ) }
							/>
							<span>{ __( 'Booking/Appointments form', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<img
								src={ `${ ASSETS_URL }/images/feedback-form.png` }
								alt={ __( 'Feedback Form', 'jetpack-forms' ) }
							/>
							<span>{ __( 'Feedback form', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<img
								src={ `${ ASSETS_URL }/images/newsletter-form.png` }
								alt={ __( 'Newsletter Form', 'jetpack-forms' ) }
							/>
							<span>{ __( 'Newsletter subscription form', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<img
								src={ `${ ASSETS_URL }/images/quote-form.png` }
								alt={ __( 'Quote Form', 'jetpack-forms' ) }
							/>
							<span>{ __( 'Quote form', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<img
								src={ `${ ASSETS_URL }/images/registration-form.png` }
								alt={ __( 'Registration Form', 'jetpack-forms' ) }
							/>
							<span>{ __( 'Registration and login forms', 'jetpack-forms' ) }</span>
						</div>
					</div>
					<button className="button button-primary">
						{ __( 'Explore more patterns', 'jetpack-forms' ) }
					</button>
				</div>
			</section>
			<section className="jp-forms__landing-section bg-white-off">
				<div className="jp-forms__landing-content">
					<h1>{ __( 'You’re in full control of the data.', 'jetpack-forms' ) }</h1>
					<h1 className="mb-12">{ __( 'Empower your workflow.', 'jetpack-forms' ) }</h1>
					<div className="jp-forms__features">
						<div className="jp-forms__feature feature-connect">
							<div className="jp-forms__feature-image-wrapper">
								<img
									src={ `${ ASSETS_URL }/images/google-sheets-icon.png` }
									alt={ __( 'Google Sheets icon', 'jetpack-forms' ) }
								/>
								<img
									src={ `${ ASSETS_URL }/images/salesforce-icon.png` }
									alt={ __( 'Salesforce icon', 'jetpack-forms' ) }
								/>
							</div>
							<h1>{ __( 'Connect with apps you already work with', 'jetpack-forms' ) }</h1>
						</div>
						<div className="jp-forms__feature feature-data">
							<h4>{ __( 'Manage your data in wp-admin', 'jetpack-forms' ) }</h4>
							<WordpressSVG />
						</div>
						<div className="jp-forms__feature feature-akismet">
							<AkismetSVG className="mb-6" />
							<h4>{ __( 'No spam with Akismet', 'jetpack-forms' ) }</h4>
						</div>
						<div className="jp-forms__feature feature-export">
							<ExportSVG />
							<h4>{ __( 'Export your data anytime', 'jetpack-forms' ) }</h4>
						</div>
						<div className="jp-forms__feature feature-notifications">
							<NotificationsSVG className="mb-6" />
							<h4>{ __( 'Real-time notifications via email', 'jetpack-forms' ) }</h4>
						</div>
						<div className="jp-forms__feature feature-dependencies">
							<h1>
								<span>{ __( 'Nada', 'jetpack-forms' ) }</span>
								{ __( 'Zero', 'jetpack-forms' ) }
								<span>{ __( 'Ziltch', 'jetpack-forms' ) }</span>
							</h1>
							<h4 className="align-center">
								{ __( 'No additional plugins required', 'jetpack-forms' ) }
							</h4>
						</div>
						<div className="jp-forms__feature feature-validation">
							<div className="jp-forms__feature-image-wrapper align-center mb-4">
								<CheckSVG />
								<CloseSVG />
							</div>
							<h4 className="align-center">{ __( 'Auto field validation', 'jetpack-forms' ) }</h4>
						</div>
					</div>
				</div>
			</section>
			<section className="jp-forms__landing-section align-center">
				<div className="jp-forms__landing-content">
					<h4 className="mb-6">{ __( 'You are in good company.', 'jetpack-forms' ) }</h4>
					<h1 className="jp-forms__wp-sites mb-8">
						{ __( 'Trusted by more than 5 million WordPress sites.', 'jetpack-forms' ) }
					</h1>
					<button className="button button-primary">
						{ __( 'Get started with Jetpack Forms', 'jetpack-forms' ) }
					</button>
				</div>
			</section>
			<section className="jp-forms__landing-section bg-white-off">
				<div className="jp-forms__landing-content">
					<h1 className="mb-6">{ __( 'Frequently Asked Questions', 'jetpack-forms' ) }</h1>
					<Details summary={ __( 'What do I need to use Jetpack Forms?', 'jetpack-forms' ) }>
						{ __(
							'You simply need to add a Jetpack form to one of your pages or posts to start collecting data.',
							'jetpack-forms'
						) }
					</Details>
					<Details summary={ __( 'How much does Jetpack Forms cost?', 'jetpack-forms' ) }>
						{ __(
							'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur lacus turpis, dignissim in urna et, egestas consectetur nibh. Praesent in neque placerat, varius sapien eu, sollicitudin arcu. Suspendisse justo nibh, gravida vitae efficitur non, hendrerit non velit.',
							'jetpack-forms'
						) }
					</Details>
					<Details summary={ __( 'Where is my data stored?', 'jetpack-forms' ) }>
						{ __(
							'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur lacus turpis, dignissim in urna et, egestas consectetur nibh. Praesent in neque placerat, varius sapien eu, sollicitudin arcu. Suspendisse justo nibh, gravida vitae efficitur non, hendrerit non velit.',
							'jetpack-forms'
						) }
					</Details>
					<Details summary={ __( 'Is Jetpack Forms GDPR compliant?', 'jetpack-forms' ) }>
						{ __(
							'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur lacus turpis, dignissim in urna et, egestas consectetur nibh. Praesent in neque placerat, varius sapien eu, sollicitudin arcu. Suspendisse justo nibh, gravida vitae efficitur non, hendrerit non velit.',
							'jetpack-forms'
						) }
					</Details>
					<Details summary={ __( 'Do I need coding skills to connect my data?', 'jetpack-forms' ) }>
						{ __(
							'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur lacus turpis, dignissim in urna et, egestas consectetur nibh. Praesent in neque placerat, varius sapien eu, sollicitudin arcu. Suspendisse justo nibh, gravida vitae efficitur non, hendrerit non velit.',
							'jetpack-forms'
						) }
					</Details>
					<Details summary={ __( 'Is there a form responses limit?', 'jetpack-forms' ) }>
						{ __(
							'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur lacus turpis, dignissim in urna et, egestas consectetur nibh. Praesent in neque placerat, varius sapien eu, sollicitudin arcu. Suspendisse justo nibh, gravida vitae efficitur non, hendrerit non velit.',
							'jetpack-forms'
						) }
					</Details>
					<Details summary={ __( 'What if I would need some help?', 'jetpack-forms' ) }>
						{ __(
							'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur lacus turpis, dignissim in urna et, egestas consectetur nibh. Praesent in neque placerat, varius sapien eu, sollicitudin arcu. Suspendisse justo nibh, gravida vitae efficitur non, hendrerit non velit.',
							'jetpack-forms'
						) }
					</Details>
				</div>
			</section>
		</Layout>
	);
};

export default LandingPage;
