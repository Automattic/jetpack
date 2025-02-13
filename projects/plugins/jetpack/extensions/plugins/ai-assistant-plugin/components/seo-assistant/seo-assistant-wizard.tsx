import debugFactory from 'debug';
import './style.scss';
import AssistantWizard from './assistant-wizard';
import { useCompletionStep } from './use-completion-step';
import { useKeywordsStep } from './use-keywords-step';
import { useMetaDescriptionStep } from './use-meta-description-step';
import { useTitleStep } from './use-title-step';
import { useWelcomeStep } from './use-welcome-step';

const debug = debugFactory( 'jetpack-ai:seo-assistant-wizard' );

export default function SeoAssistantWizard( { close }: { close?: () => void } ) {
	const keywordsStepData = useKeywordsStep();
	const titleStepData = useTitleStep( { keywords: keywordsStepData.value, mockRequests: false } );
	const metaStepData = useMetaDescriptionStep( {
		keywords: keywordsStepData.value,
		mockRequests: false,
	} );
	const welcomeStepData = useWelcomeStep( {
		stepLabels: [ titleStepData.label, metaStepData.label ],
	} );
	const completionStepData = useCompletionStep();

	debug( 'render seo assistant wizard' );

	return (
		<AssistantWizard
			close={ close }
			steps={ [
				welcomeStepData,
				keywordsStepData,
				titleStepData,
				metaStepData,
				completionStepData,
			] }
		/>
	);
}
