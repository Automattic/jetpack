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
import { useDescriptionStep } from './use-description-step';
import { useKeywordsStep } from './use-keywords-step';
import { useTitleStep } from './use-title-step';
import { useWelcomeStep } from './use-welcome-step';
import WizardChat from './wizard-chat';
import './style.scss';
/**
 * Types
 */
import type { SeoAssistantDispatch } from './types';
import type { Block } from '@automattic/jetpack-ai-client';

const debug = debugFactory( 'jetpack-seo:wizard-chat' );

export default function SeoAssistantWizard() {
	const imageBlocks = useSelect(
		select =>
			select( editorStore )
				.getBlocks()
				.filter( ( block: Block ) => block.name === 'core/image' ),
		[]
	);

	const keywordsStepData = useKeywordsStep();
	const titleStepData = useTitleStep( { keywords: keywordsStepData.value, mockRequests: false } );
	const descriptionStepData = useDescriptionStep( {
		keywords: keywordsStepData.value,
		mockRequests: false,
	} );
	const altTextSteps = useAltTextStep( {
		keywords: keywordsStepData.value,
		mockRequests: false,
		imageBlocks,
	} );
	const { close } = useDispatch( seoAssistantStore ) as SeoAssistantDispatch;

	const welcomeStepData = useWelcomeStep( {
		stepLabels: [ titleStepData, descriptionStepData, ...altTextSteps ].map( step => step.label ),
	} );
	const completionStepData = useCompletionStep();

	debug( 'render seo assistant wizard', altTextSteps );

	return (
		<WizardChat
			close={ close }
			steps={ [
				welcomeStepData,
				keywordsStepData,
				titleStepData,
				descriptionStepData,
				...altTextSteps,
				completionStepData,
			] }
			assistantName={ 'seo-assistant' }
		/>
	);
}
