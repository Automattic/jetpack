import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import stepEight from '../../../images/step-eight.png';
import stepFourPlaceholder from '../../../images/step-four-placeholder.png';
import stepOne from '../../../images/step-one.png';
import stepSixPlaceholder from '../../../images/step-six-placeholder.png';
import stepThreePlaceholder from '../../../images/step-three-placeholder.png';
import stepTwo from '../../../images/step-two.png';
import { stepImage, stepVideo } from '../utils/stepAssets';

const videoBaseUrl = 'https://videos.files.wordpress.com';

const stepFiveSrc = `${ videoBaseUrl }/M8spKcbL/ai-onboarding-step-five-1.mp4`;
const stepSevenSrc = `${ videoBaseUrl }/dqS0iYcM/ai-onboarding-step-seven.mp4`;

export const assetSources = [
	stepOne,
	stepTwo,
	stepThreePlaceholder,
	stepFourPlaceholder,
	stepFiveSrc,
	stepSixPlaceholder,
	stepSevenSrc,
	stepEight,
];

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
		image: stepImage( stepOne, '' ),
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
		image: stepImage( stepTwo, 'Gutenburg block search with "AI" typed out in the search box.' ),
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
		// Placeholder image, need updated video
		image: stepImage( stepThreePlaceholder, '' ),
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
		// Placeholder image, need updated video
		image: stepImage( stepFourPlaceholder, '' ),
	},
	{
		content: (
			<div className="ai-assistant-onboarding-guide__content">
				<h2>{ __( 'Effortless Content Enhancement', 'jetpack' ) }</h2>
				<p>
					{ createInterpolateElement(
						__(
							'The AI Assistant checks spelling, translates, adjusts tone, and much more. To experience this, <strong>select a content block</strong> and <strong>click the AI Assistant symbol.</strong>',
							'jetpack'
						),
						{ strong: <strong /> }
					) }
				</p>
			</div>
		),
		// Placeholder image, need updated video
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
		// Placeholder image, need updated video
		image: stepImage( stepSixPlaceholder, '' ),
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
		// Placeholder image, need updated video
		image: stepVideo( stepSevenSrc ),
	},
	{
		content: (
			<div className="ai-assistant-onboarding-guide__content">
				<h2>{ __( 'Unleash Your Full Potential', 'jetpack' ) }</h2>
				<p>
					{ sprintf(
						// translators: %s is the monthly price of the AI Assistant plan
						__(
							'Try AI Assistant for free to see how compelling your content can be. After 20 requests, purchase AI Assistant for %s per month and watch your productivity flourish.',
							'jetpack'
						),
						'something'
					) }
				</p>
			</div>
		),
		image: stepImage( stepEight, '' ),
	},
];
