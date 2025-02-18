/**
 * External dependencies
 */
import { useDispatch } from '@wordpress/data';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { store as seoAssistantStore } from './store';
import { useCompletionStep } from './use-completion-step';
import { useKeywordsStep } from './use-keywords-step';
import { useMetaDescriptionStep } from './use-meta-description-step';
import { useTitleStep } from './use-title-step';
import { useWelcomeStep } from './use-welcome-step';
import WizardChat from './wizard-chat';
import './style.scss';
/**
 * Types
 */
import type { SeoAssistantDispatch } from './types';

const debug = debugFactory( 'jetpack-seo:wizard-chat' );

export default function SeoAssistantWizard() {
	const keywordsStepData = useKeywordsStep();
	const titleStepData = useTitleStep( { keywords: keywordsStepData.value, mockRequests: false } );
	const metaStepData = useMetaDescriptionStep( {
		keywords: keywordsStepData.value,
		mockRequests: false,
	} );
	const { close } = useDispatch( seoAssistantStore ) as SeoAssistantDispatch;

	// ALL Pre-process should be done here, before the wizard is rendered.
	// TODO: scavenge the post and see if there are image blocks there, NOT gallery blocks, not COVER blocks, but image blocks
	// if there are, add a step to the wizard for each image. Each image step should use a vision
	// request to get an image description, and then use that description to generate alt text for the image.

	const welcomeStepData = useWelcomeStep( {
		stepLabels: [ titleStepData.label, metaStepData.label ],
	} );
	const completionStepData = useCompletionStep();

	debug( 'render seo assistant wizard' );

	return (
		<WizardChat
			close={ close }
			steps={ [
				welcomeStepData,
				keywordsStepData,
				titleStepData,
				metaStepData,
				completionStepData,
			] }
			assistantName={ 'seo-assistant' }
		/>
	);
}
