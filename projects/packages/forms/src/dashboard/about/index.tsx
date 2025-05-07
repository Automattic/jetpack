/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { Card, CardBody, CardFooter, Dashicon, ExternalLink } from '@wordpress/components';
import { createInterpolateElement, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import CreateFormButton from '../components/create-form-button';
import Details from '../components/details';
import { config } from '../index';
import AkismetSVG from './svg/akismet-svg';
import CheckSVG from './svg/check-svg';
import CloseSVG from './svg/close-svg';
import ExportSVG from './svg/export-svg';
import NotificationsSVG from './svg/notifications-svg';
import WordpressSVG from './svg/wordpress-svg';
/**
 * Style dependencies
 */
import './style.scss';

const About = () => {
	const ASSETS_URL = useMemo( () => config( 'pluginAssetsURL' ), [] );

	const patterns = useMemo(
		() => [
			{
				image: `${ ASSETS_URL }/images/contact-form.png`,
				title: __( 'Contact form', 'jetpack-forms' ),
				recommended: true,
				description: __(
					'Simple form for general inquiries or support requests.',
					'jetpack-forms'
				),
			},
			{
				image: `${ ASSETS_URL }/images/rsvp-form.png`,
				title: __( 'RSVP form', 'jetpack-forms' ),
				recommended: true,
				description: __(
					'Collect attendance confirmations for your event, conference or online event.',
					'jetpack-forms'
				),
			},
			{
				image: `${ ASSETS_URL }/images/registration-form.png`,
				title: __( 'Registration form', 'jetpack-forms' ),
				description: __(
					'Capture user sign-ups with customizable fields and open field input.',
					'jetpack-forms'
				),
			},
			{
				image: `${ ASSETS_URL }/images/feedback-form.png`,
				title: __( 'Feedback form', 'jetpack-forms' ),
				description: __(
					'Get user insights and ratings to improve your service.',
					'jetpack-forms'
				),
			},
			{
				image: `${ ASSETS_URL }/images/appointment-form.png`,
				title: __( 'Appointment form', 'jetpack-forms' ),
				description: __(
					'Let users schedule calls, consultations or meetings with ease.',
					'jetpack-forms'
				),
			},
			{
				image: `${ ASSETS_URL }/images/salesforce-form.png`,
				title: __( 'Salesforce lead form', 'jetpack-forms' ),
				description: __( 'Generate and sync leads directly to Salesforce CRM.', 'jetpack-forms' ),
			},
		],
		[ ASSETS_URL ]
	);

	const isWpcomSite = isWpcomPlatformSite();

	return (
		<div className="jp-forms__about">
			<div className="section-patterns">
				<div className="section-patterns__header">
					<h1>{ __( 'The simplest way to create forms', 'jetpack-forms' ) }</h1>
					<p className="section-patterns__header-description">
						{ __( 'Start with one of many patterns, customize to your needs', 'jetpack-forms' ) }
					</p>
					<CreateFormButton showPatterns />
				</div>
				<div className="section-patterns__grid">
					{ patterns.map( pattern => (
						<Card key={ pattern.title } className="section-patterns__grid-card">
							<CardBody>
								<div className="section-patterns__grid-card-body-wrapper">
									<img src={ pattern.image } alt={ pattern.title } />
								</div>
							</CardBody>
							<CardFooter>
								<div className="section-patterns__grid-card-footer">
									<div className="section-patterns__grid-card-title">
										<h4>{ pattern.title }</h4>
										{ pattern.recommended && (
											<div>
												<span className="section-patterns__grid-card-recommended-badge">
													<Dashicon icon="yes-alt" size={ 16 } />
													{ __( 'Recommended', 'jetpack-forms' ) }
												</span>
											</div>
										) }
									</div>
									<p>{ pattern.description }</p>
								</div>
							</CardFooter>
						</Card>
					) ) }
				</div>
			</div>
			<div className="section-data">
				<div className="section-data__container">
					<h1>{ __( 'You’re in full control of the data.', 'jetpack-forms' ) }</h1>
					<h1>{ __( 'Empower your workflow.', 'jetpack-forms' ) }</h1>
					<div className="section-data__features">
						<div className="section-data__features-feature feature-connect">
							<div className="app-icons-wrapper">
								<AkismetSVG width={ 32 } height={ 32 } className="akismet-icon" />
								<img
									src={ `${ ASSETS_URL }/images/jetpack-icon.png` }
									alt={ __( 'Jetpack icon', 'jetpack-forms' ) }
								/>
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
						<div className="section-data__features-feature feature-data">
							<h1>{ __( 'Manage your data in wp-admin', 'jetpack-forms' ) }</h1>
							<WordpressSVG />
						</div>
						<div className="section-data__features-feature feature-akismet">
							<AkismetSVG />
							<h2>{ __( 'No spam with Akismet', 'jetpack-forms' ) }</h2>
						</div>
						<div className="section-data__features-feature feature-export">
							<ExportSVG />
							<h2>{ __( 'Export your data anytime', 'jetpack-forms' ) }</h2>
						</div>
						<div className="section-data__features-feature feature-notifications">
							<NotificationsSVG />
							<h2>{ __( 'Real-time notifications via email', 'jetpack-forms' ) }</h2>
						</div>
						<div className="section-data__features-feature feature-dependencies">
							<h1 className="zero-plugins"> { __( 'Zero', 'jetpack-forms' ) }</h1>
							<h2>{ __( 'No additional plugins required', 'jetpack-forms' ) }</h2>
						</div>
						<div className="section-data__features-feature feature-validation">
							<div className="validation-icons-wrapper">
								<CheckSVG />
								<CloseSVG />
							</div>
							<h2>{ __( 'Auto field validation', 'jetpack-forms' ) }</h2>
						</div>
					</div>
				</div>
			</div>
			<div className="section-trust">
				<h3>{ __( 'You are in good company', 'jetpack-forms' ) }</h3>
				<h1>{ __( 'Trusted by more than 5 million WordPress sites', 'jetpack-forms' ) }</h1>
				<CreateFormButton label={ __( 'Create form', 'jetpack-forms' ) } />
			</div>
			<div className="section-faq">
				<div className="section-faq__container">
					<h1>{ __( 'Frequently Asked Questions', 'jetpack-forms' ) }</h1>
					<Details summary={ __( 'What do I need to use Jetpack Forms?', 'jetpack-forms' ) }>
						{ __(
							'To get started, simply open the WordPress editor and search for the "Form" block in the block library. You can then add the form block and its corresponding child blocks, such as the text input field or multiple choice block, to your website. You can easily manage incoming form responses within the WP-Admin area.',
							'jetpack-forms'
						) }
					</Details>
					{ ! isWpcomSite && (
						<Details summary={ __( 'How much does Jetpack Forms cost?', 'jetpack-forms' ) }>
							{ __(
								'Jetpack Forms is currently free and comes by default with your Jetpack plugin.',
								'jetpack-forms'
							) }
						</Details>
					) }
					<Details summary={ __( 'Is Jetpack Forms GDPR compliant?', 'jetpack-forms' ) }>
						{ createInterpolateElement(
							__(
								'Jetpack and its parent company Automattic take data privacy and the GDPR very seriously. We respect the GDPR’s principles of minimizing the amount of data we collect, being transparent about what data we collect and how we use it, complying with EU law in regards to any data that is transferred to non-EU countries, and not keeping data longer than we need it for the purpose it was collected. You can read more about the data we collect, how data is used and shared, and how long data is retained in <a>our Privacy Policy</a>.',
								'jetpack-forms'
							),
							{
								a: <ExternalLink href={ getRedirectUrl( 'a8c-privacy' ) } />,
							}
						) }
					</Details>
					<Details summary={ __( 'Is there a form responses limit?', 'jetpack-forms' ) }>
						{ __( 'No.', 'jetpack-forms' ) }
					</Details>
					<Details summary={ __( 'What if I would need some help?', 'jetpack-forms' ) }>
						{ createInterpolateElement(
							__(
								'If you have more specific questions about Jetpack and Forms feel free to <a>reach out to us</a> and we’ll be happy to help.',
								'jetpack-forms'
							),
							{
								a: isWpcomSite ? (
									<a href={ getRedirectUrl( 'wpcom-contact-support' ) } />
								) : (
									<ExternalLink href={ getRedirectUrl( 'jetpack-contact-support' ) } />
								),
							}
						) }
					</Details>
				</div>
			</div>
		</div>
	);
};

export default About;
