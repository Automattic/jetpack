/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
/**
 * Internal dependencies
 */
import Details from '../components/details';
import Layout from '../components/layout';
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

const LandingPage = () => {
	const ASSETS_URL = config( 'pluginAssetsURL' );
	const TEASER_IMG_PATH =
		isAtomicSite() || isSimpleSite() ? 'responses-inbox-wp-com.png' : 'responses-inbox.png';

	useEffect( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_display' );
	}, [] );

	const onButtonClickHandler = showPatterns => async () => {
		const data = new FormData();

		data.append( 'action', 'create_new_form' );
		data.append( 'newFormNonce', config( 'newFormNonce' ) );

		const response = await fetch( window.ajaxurl, { method: 'POST', body: data } );
		const { post_url } = await response.json();

		if ( post_url ) {
			jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_cta_click', {
				button: 'forms',
			} );
			window.open( `${ post_url }${ showPatterns ? '&showJetpackFormsPatterns' : '' }` );
		}
	};

	const onAIButtonClickHandler = () => {
		const siteHasAI = config( 'hasAI' );

		if ( siteHasAI ) {
			onButtonClickHandler( false )();
		} else {
			const plansPageUrl = getRedirectUrl( 'jetpack-plans', {
				site: config( 'siteURL' ),
				anchor: 'jetpack_ai_yearly',
			} );
			jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_cta_click', {
				button: 'ai',
				isAIEnabledForSite: siteHasAI,
			} );
			window.open( plansPageUrl );
		}
	};

	return (
		<Layout className="jp-forms__landing" showFooter>
			<section className="jp-forms__landing-section bg-white-off">
				<div className="jp-forms__landing-content">
					<h1 className="mb-2">{ __( 'Building forms made easy', 'jetpack-forms' ) }</h1>
					<h4 className="mb-8">
						{ __( 'Free, flexible, fast, and it works out of the box.', 'jetpack-forms' ) }
					</h4>
					<button className="button button-primary mb-10" onClick={ onButtonClickHandler( false ) }>
						{ __( 'Create your first form', 'jetpack-forms' ) }
					</button>
					<img
						src={ `${ ASSETS_URL }/images/${ TEASER_IMG_PATH }` }
						className="jp-forms__teaser-image"
						alt={ __( 'Jetpack Forms teaser video', 'jetpack-forms' ) }
					/>
				</div>
			</section>
			<section className="jp-forms__landing-section features-block">
				<div className="jp-forms__landing-content">
					<div className="jp-forms__block">
						<div className="jp-forms__block-text">
							<h1 className="mb-6">
								{ __( 'Jetpack AI Assistant makes creating forms a breeze.', 'jetpack-forms' ) }
							</h1>
							<p>
								{ __(
									'Jetpack AI Assistant enhances the Forms Block with AI-powered features for effortless form creation:',
									'jetpack-forms'
								) }
							</p>
							<ul>
								<li>
									{ __(
										'Creating a registration form for a global event? Automatically populate a country dropdown list with the AI Assistant.',
										'jetpack-forms'
									) }
								</li>
								<li>
									{ __(
										'Need an RSVP form for your event site? Simply ask AI Assistant to prepare a form that includes options for meal preferences, attendance status, or plus-ones.',
										'jetpack-forms'
									) }
								</li>
							</ul>
							<button
								className="button button-primary"
								//eslint-disable-next-line react/jsx-no-bind
								onClick={ onAIButtonClickHandler }
							>
								{ __( 'Explore Jetpack AI', 'jetpack-forms' ) }
							</button>
						</div>
						<div className="jp-forms__block-media">
							<img
								src={ `${ ASSETS_URL }/images/ai-forms.png` }
								alt={ __(
									'An illustration demonstrating how Jetpack AI can help to create forms',
									'jetpack-forms'
								) }
							/>
						</div>
					</div>
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
								src={ `${ ASSETS_URL }/images/registration-form.png` }
								alt={ __( 'Registration Form', 'jetpack-forms' ) }
							/>
							<span>{ __( 'Registration and login forms', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<img
								src={ `${ ASSETS_URL }/images/feedback-form.png` }
								alt={ __( 'Feedback Form', 'jetpack-forms' ) }
							/>
							<span>{ __( 'Feedback form', 'jetpack-forms' ) }</span>
						</div>
					</div>
					<button className="button button-primary" onClick={ onButtonClickHandler( true ) }>
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
					<button className="button button-primary" onClick={ onButtonClickHandler( false ) }>
						{ __( 'Get started with Jetpack Forms', 'jetpack-forms' ) }
					</button>
				</div>
			</section>
			<section className="jp-forms__landing-section bg-white-off">
				<div className="jp-forms__landing-content">
					<h1 className="mb-6">{ __( 'Frequently Asked Questions', 'jetpack-forms' ) }</h1>
					<Details summary={ __( 'What do I need to use Jetpack Forms?', 'jetpack-forms' ) }>
						{ __(
							'Jetpack Forms is activated by default, so it\'s already fully functional. To get started, simply open the WordPress editor and search for the "Form" block in the block library. You can then add the form block and its corresponding child blocks, such as the text input field or multiple choice block, to your website. You can easily manage incoming form responses within the WP-Admin area.',
							'jetpack-forms'
						) }
					</Details>
					<Details summary={ __( 'How much does Jetpack Forms cost?', 'jetpack-forms' ) }>
						{ __(
							'Jetpack Forms is currently free and comes by default with your Jetpack plugin.',
							'jetpack-forms'
						) }
					</Details>
					<Details summary={ __( 'Is Jetpack Forms GDPR compliant?', 'jetpack-forms' ) }>
						{ createInterpolateElement(
							__(
								'Jetpack and its parent company Automattic take data privacy and the GDPR very seriously. We respect the GDPR’s principles of minimizing the amount of data we collect, being transparent about what data we collect and how we use it, complying with EU law in regards to any data that is transferred to non-EU countries, and not keeping data longer than we need it for the purpose it was collected. You can read more about the data we collect, how data is used and shared, and how long data is retained in <a>our Privacy Policy</a>.',
								'jetpack-forms'
							),
							{
								a: (
									<a
										href="https://automattic.com/privacy/"
										rel="noreferrer noopener"
										target="_blank"
									/>
								),
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
								a: (
									<a
										href="https://jetpack.com/contact-support/"
										rel="noreferrer noopener"
										target="_blank"
									/>
								),
							}
						) }
					</Details>
				</div>
			</section>
		</Layout>
	);
};

export default LandingPage;
