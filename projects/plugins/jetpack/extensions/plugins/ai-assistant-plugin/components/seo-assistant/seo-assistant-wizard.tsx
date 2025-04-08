/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
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
import type * as BlockEditorSelectors from '@wordpress/block-editor/store/selectors.js';

export default function SeoAssistantWizard() {
	const imageBlocks = useSelect(
		select =>
			( select( 'core/block-editor' ) as typeof BlockEditorSelectors )
				.getBlocks()
				.filter( ( block: Block ) => block.name === 'core/image' )
				.filter( ( block: Block ) => !! block.attributes.url ),
		[]
	);

	const { close } = useDispatch( seoAssistantStore ) as SeoAssistantDispatch;
	const keywordsStepData = useKeywordsStep();
	const titleStepData = useTitleStep( { keywords: keywordsStepData.value, mockRequests: false } );
	const descriptionStepData = useDescriptionStep( {
		keywords: keywordsStepData.value,
	} );
	const altTextSteps = useAltTextStep( {
		keywords: keywordsStepData.value,
		imageBlocks,
	} );
	const welcomeStepData = useWelcomeStep( {
		stepLabels: [ titleStepData, descriptionStepData, ...altTextSteps ].map( step => step.label ),
	} );
	const completionStepData = useCompletionStep();

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
