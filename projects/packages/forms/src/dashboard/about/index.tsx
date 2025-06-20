/**
 * External dependencies
 */
import { getRedirectUrl, JetpackIcon } from '@automattic/jetpack-components';
import { isSimpleSite, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import AkismetIcon from '../../icons/akismet';
import CreativeMailIcon from '../../icons/creative-mail';
import GoogleSheetsIcon from '../../icons/google-sheets';
import SalesforceIcon from '../../icons/salesforce';
import CreateFormButton from '../components/create-form-button';
import Details from '../components/details';
import { config } from '../index';
import PatternCard from './pattern-card';
import CheckSVG from './svg/check-svg';
import CloseSVG from './svg/close-svg';
import ExportSVG from './svg/export-svg';
import NotificationsSVG from './svg/notifications-svg';
import WordpressSVG from './svg/wordpress-svg';
/**
 * Style dependencies
 */
import './style.scss';
/**
 * Types
 */
import type { Pattern } from '../../types';

const About = () => {
	const ASSETS_URL = useMemo( () => config( 'pluginAssetsURL' ), [] );

	const patterns: Pattern[] = useMemo(
		() => [
			{
				image: `${ ASSETS_URL }/images/contact-form.png`,
				title: __( 'Contact form', 'jetpack-forms' ),
				recommended: true,
				code: 'contact-form',
				description: __(
					'Simple form for general inquiries or support requests.',
					'jetpack-forms'
				),
			},
			{
				image: `${ ASSETS_URL }/images/rsvp-form.png`,
				title: __( 'RSVP form', 'jetpack-forms' ),
				recommended: true,
				code: 'rsvp-form',
				description: __(
					'Collect attendance confirmations for your event, conference or online event.',
					'jetpack-forms'
				),
			},
			{
				image: `${ ASSETS_URL }/images/registration-form.png`,
				title: __( 'Registration form', 'jetpack-forms' ),
				code: 'registration-form',
				description: __(
					'Capture user sign-ups with customizable fields and open field input.',
					'jetpack-forms'
				),
			},
			{
				image: `${ ASSETS_URL }/images/feedback-form.png`,
				title: __( 'Feedback form', 'jetpack-forms' ),
				code: 'feedback-form',
				description: __(
					'Get user insights and ratings to improve your service.',
					'jetpack-forms'
				),
			},
			{
				image: `${ ASSETS_URL }/images/appointment-form.png`,
				title: __( 'Appointment form', 'jetpack-forms' ),
				code: 'appointment-form',
				description: __(
					'Let users schedule calls, consultations or meetings with ease.',
					'jetpack-forms'
				),
			},
			{
				image: `${ ASSETS_URL }/images/lead-capture-form.png`,
				title: __( 'Lead capture form', 'jetpack-forms' ),
				code: 'newsletter-form',
				description: __(
					'Use this form to collect contact information from potential leads.',
					'jetpack-forms'
				),
			},
		],
		[ ASSETS_URL ]
	);

	const isWpcomSite = isWpcomPlatformSite();
	const isSimple = isSimpleSite();

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
						<PatternCard key={ pattern.code } pattern={ pattern } />
					) ) }
				</div>
			</div>
			<div className="section-data">
				<div className="section-data__container">
					<h1>{ __( 'You’re in full control of the data.', 'jetpack-forms' ) }</h1>
					<h1>{ __( 'Empower your workflow.', 'jetpack-forms' ) }</h1>
					<div className="section-data__features">
						<div className="section-data__features-feature feature-connect">
							<div className="app-icons-wrapper feature-header">
								<AkismetIcon width={ 32 } height={ 32 } className="icon-round" />
								<JetpackIcon size={ 32 } className="jetpack-icon" />
								<CreativeMailIcon width={ 32 } height={ 32 } className="icon-round" />
								<GoogleSheetsIcon
									width={ 32 }
									height={ 32 }
									className="icon-round google-sheets-icon"
								/>
								<SalesforceIcon width={ 32 } height={ 32 } className="icon-round" />
							</div>
							<h1>{ __( 'Connect with apps you already work with', 'jetpack-forms' ) }</h1>
						</div>
						<div className="section-data__features-feature feature-data">
							<h1>{ __( 'Manage your data in wp-admin', 'jetpack-forms' ) }</h1>
							<WordpressSVG />
						</div>
						<div className="section-data__features-feature feature-akismet">
							<AkismetIcon className="feature-header" />
							<h2>{ __( 'No spam with Akismet', 'jetpack-forms' ) }</h2>
						</div>
						<div className="section-data__features-feature feature-export">
							<ExportSVG className="feature-header" />
							<h2>{ __( 'Export your data anytime', 'jetpack-forms' ) }</h2>
						</div>
						<div className="section-data__features-feature feature-notifications">
							<NotificationsSVG className="feature-header" />
							<h2>{ __( 'Real-time notifications via email', 'jetpack-forms' ) }</h2>
						</div>
						<div className="section-data__features-feature feature-dependencies">
							<h1 className="zero-plugins feature-header"> { __( 'Zero', 'jetpack-forms' ) }</h1>
							<h2>{ __( 'No additional plugins required', 'jetpack-forms' ) }</h2>
						</div>
						<div className="section-data__features-feature feature-validation">
							<div className="validation-icons-wrapper feature-header">
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
					{ ! isSimple && (
						<Details
							summary={ __( 'Can I change Forms functionality via code?', 'jetpack-forms' ) }
						>
							{ createInterpolateElement(
								__(
									'Yes! You can change several aspects of Forms by using <filtersDocs>WordPress filters</filtersDocs>. Please see our <devDocs>developer documentation</devDocs> for full list of available filters and details.',
									'jetpack-forms'
								),
								{
									filtersDocs: (
										<ExternalLink href="https://developer.wordpress.org/plugins/hooks/filters/" />
									),
									devDocs: (
										<ExternalLink href={ getRedirectUrl( 'jetpack-developer-docs-forms' ) } />
									),
								}
							) }
						</Details>
					) }
					<Details summary={ __( 'What if I would need some help?', 'jetpack-forms' ) }>
						{ createInterpolateElement(
							__(
								'If you have more specific questions about Jetpack and Forms feel free to <a>reach out to us</a> and we’ll be happy to help.',
								'jetpack-forms'
							),
							{
								a: isWpcomSite ? (
									<a href={ getRedirectUrl( 'jetpack-contact-support' ) } />
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
