/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { store as seoAssistantStore } from './store';
import { useAltTextStep } from './use-alt-text-step';
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

	const imageBlocks = useSelect(
		select =>
			select( editorStore )
				.getBlocks()
				.filter( block => block.name === 'core/image' ),
		[]
	);

	const altTextStep1 = useAltTextStep( {
		clientId: imageBlocks[ 1 ].clientId,
		mockRequests: true,
		contextValue: keywordsStepData.value,
		imageUrl: imageBlocks[ 1 ].attributes.url,
	} );

	// ALL Pre-process should be done here, before the wizard is rendered.
	// TODO: scavenge the post and see if there are image blocks there, NOT gallery blocks, not COVER blocks, but image blocks
	// if there are, add a step to the wizard for each image. Each image step should use a vision
	// request to get an image description, and then use that description to generate alt text for the image.

	const welcomeStepData = useWelcomeStep( {
		stepLabels: [ titleStepData.label, metaStepData.label, altTextStep1.label ],
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
				altTextStep1,
				completionStepData,
			] }
			assistantName={ 'seo-assistant' }
		/>
	);
}
