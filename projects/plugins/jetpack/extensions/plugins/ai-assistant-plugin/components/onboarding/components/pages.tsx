import { getIconBySlug } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import stepEightSrc from '../../../images/step-eight.png';
import stepOneSrc from '../../../images/step-one.png';
import stepTwoSrc from '../../../images/step-two.png';
import { stepImage, stepVideo } from '../utils/stepAssets';

const videoBaseUrl = 'https://videos.files.wordpress.com';

// Video step sources
const stepThreeSrc = `${ videoBaseUrl }/rAMPg7fJ/ai-onboarding-step-three-1.mp4`;
const stepFourSrc = `${ videoBaseUrl }/25jTgvw2/ai-onboarding-step-four.mp4`;
const stepFiveSrc = `${ videoBaseUrl }/1OUpa2Q0/ai-onboarding-step-five-2.mp4`;
const stepSixSrc = `${ videoBaseUrl }/Db70vWPA/ai-onboarding-step-six.mp4`;
const stepSevenSrc = `${ videoBaseUrl }/2RyheZNZ/ai-onboarding-step-seven-1.mp4`;

export const assetSources = [
	stepOneSrc,
	stepTwoSrc,
	stepThreeSrc,
	stepFourSrc,
	stepFiveSrc,
	stepSixSrc,
	stepSevenSrc,
	stepEightSrc,
];

const AiAssistantIcon = getIconBySlug( 'ai-assistant' );

export const pages = [
	{
		content: (
			<div className="ai-assistant-onboarding-guide__content">
				<h2>{ __( 'Discover Jetpack AI Assistant', 'jetpack' ) }</h2>
				<p>
					{ __(
						'With this short guide, learn how to polish, proof, and publish content using your AI Assistant.',
						'jetpack'
					) }
				</p>
			</div>
		),
		image: stepImage( stepOneSrc, '' ),
	},
	{
		content: (
			<div className="ai-assistant-onboarding-guide__content">
				<h2>{ __( 'Find AI Assistant', 'jetpack' ) }</h2>
				<p>
					{ createInterpolateElement(
						__(
							'<strong>Click on the + icon</strong> and <strong>type AI Assistant</strong> into the search box to add this powerful tool to your page.',
							'jetpack'
						),
						{
							strong: <strong />,
						}
					) }
				</p>
			</div>
		),
		image: stepImage( stepTwoSrc, 'Gutenburg block search with "AI" typed out in the search box.' ),
	},
	{
		content: (
			<div className="ai-assistant-onboarding-guide__content">
				<h2>{ __( 'Content Creation, Accelerated', 'jetpack' ) }</h2>
				<p>
					{ createInterpolateElement(
						__(
							"<strong>Click 'Write with AI'</strong>, then <strong>select 'Post about..'.</strong> For this tutorial, let’s prompt the AI Assistant to draft a post on “What makes a perfect pizza?”",
							'jetpack'
						),
						{ strong: <strong /> }
					) }
				</p>
			</div>
		),
		image: stepVideo( stepThreeSrc ),
	},
	{
		content: (
			<div className="ai-assistant-onboarding-guide__content">
				<h2>{ __( 'Let’s Collaborate with AI', 'jetpack' ) }</h2>
				<p>
					{ __(
						'Accept AI Assistant’s draft. Now you can begin the collaborative process, working with AI to perfect your content.',
						'jetpack'
					) }
				</p>
			</div>
		),
		image: stepVideo( stepFourSrc ),
	},
	{
		content: (
			<div className="ai-assistant-onboarding-guide__content">
				<h2>{ __( 'Effortless Content Enhancement', 'jetpack' ) }</h2>
				<p>
					{ createInterpolateElement(
						// translators: &nbsp; is a non-breaking space
						__(
							'The AI Assistant checks spelling, translates, adjusts tone, and much more. To experience this, <strong>select a content block</strong> and <strong>click the AI Assistant symbol.</strong>',
							'jetpack'
						),
						{
							strong: <strong />,
						}
					) }
					<AiAssistantIcon className="ai-assistant-icon" />
				</p>
			</div>
		),
		image: stepVideo( stepFiveSrc ),
	},
	{
		content: (
			<div className="ai-assistant-onboarding-guide__content">
				<h2>{ __( 'Create Forms with Ease', 'jetpack' ) }</h2>
				<p>
					{ createInterpolateElement(
						__(
							"<strong>Add a 'Form' block</strong> and <strong>instruct the AI Assistant</strong> to create a feedback form, asking readers about their preferred pizza types and toppings.",
							'jetpack'
						),
						{ strong: <strong /> }
					) }
				</p>
			</div>
		),
		image: stepVideo( stepSixSrc ),
	},
	{
		content: (
			<div className="ai-assistant-onboarding-guide__content">
				<h2>{ __( 'Like Having a Personal Editor', 'jetpack' ) }</h2>
				<p>
					{ __(
						'Get tailored feedback on your drafts to ensure every post is polished and powerful before going live.',
						'jetpack'
					) }
				</p>
			</div>
		),
		image: stepVideo( stepSevenSrc ),
	},
	{
		content: (
			<div className="ai-assistant-onboarding-guide__content">
				<h2>{ __( 'Unleash Your Full Potential', 'jetpack' ) }</h2>
				<p>
					{ sprintf(
						// translators: %s is the free limit of requests
						__(
							'Try AI Assistant for free to see how compelling your content can be. After %s requests, purchase AI Assistant for continued access and watch your productivity flourish.',
							'jetpack'
						),
						20
					) }
				</p>
			</div>
		),
		image: stepImage( stepEightSrc, '' ),
	},
];
