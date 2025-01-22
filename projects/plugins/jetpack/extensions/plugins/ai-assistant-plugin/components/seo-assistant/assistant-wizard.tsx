import { Button, Icon, Tooltip } from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, closeSmall, chevronLeft } from '@wordpress/icons';
import debugFactory from 'debug';
import { useKeywordsStep } from './use-keywords-step';
import { useMetaDescriptionStep } from './use-meta-description-step';
import { useTitleStep } from './use-title-step';
import { OptionsInput, TextInput } from './wizard-input';
import WizardStep from './wizard-step';
import type { Step } from './types';

const debug = debugFactory( 'jetpack-seo:assistant-wizard' );

export default function AssistantWizard( { close, tasks } ) {
	const [ currentStep, setCurrentStep ] = useState( 0 );
	const [ currentStepData, setCurrentStepData ] = useState< Step >();
	const [ isBusy ] = useState( false );
	const [ steps, setSteps ] = useState( [] );
	const stepsEndRef = useRef( null );
	const scrollToBottom = () => {
		stepsEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};
	const keywordsInputRef = useRef( null );

	useEffect( () => {
		scrollToBottom();
	}, [ currentStep ] );

	// Keywords
	// TODO: going back doesn't restart
	const keywordsStepData = useKeywordsStep();
	const titleStepData = useTitleStep();
	const metaStepData = useMetaDescriptionStep();

	useEffect( () => {
		setSteps( [ tasks[ 0 ], keywordsStepData, titleStepData, metaStepData, tasks[ 1 ] ] );
		setCurrentStepData( tasks[ 0 ] );
	}, [ tasks, keywordsStepData, titleStepData, metaStepData ] );

	const handleNext = () => {
		if ( currentStep + 1 < 4 ) {
			debug( 'moving to ' + ( currentStep + 1 ) );
			setCurrentStep( currentStep + 1 );
			setCurrentStepData( steps[ currentStep + 1 ] );
			steps[ currentStep + 1 ].onStart?.();
		}
	};

	const handleBack = () => {
		if ( currentStep > 1 ) {
			debug( 'moving to ' + ( currentStep - 1 ) );
			setCurrentStep( currentStep - 1 );
			setCurrentStepData( steps[ currentStep - 1 ] );
			// Re-add previous step messages
		}
	};

	const handleSkip = async () => {
		await currentStepData?.onSkip?.();
		handleNext();
	};

	// Reset states and close the wizard
	const handleDone = () => {
		close();
		setCurrentStep( 0 );
		setCurrentStepData( steps[ 0 ] );
	};

	return (
		<div className="seo-assistant-wizard">
			<div className="seo-assistant-wizard__header">
				<Button variant="link" disabled={ isBusy } onClick={ handleBack }>
					<Icon icon={ chevronLeft } size={ 24 } />
				</Button>
				<h2>{ currentStepData?.title }</h2>
				<div>
					<Tooltip text={ __( 'Skip', 'jetpack' ) }>
						<Button variant="link" disabled={ isBusy } onClick={ handleSkip }>
							<Icon icon={ next } size={ 24 } />
						</Button>
					</Tooltip>
					<Button variant="link" onClick={ handleDone }>
						<Icon icon={ closeSmall } size={ 24 } />
					</Button>
				</div>
			</div>

			<div className="seo-assistant-wizard__content" style={ { overflow: 'auto' } }>
				{ steps.map( ( step, index ) => (
					<WizardStep
						key={ step.id }
						messages={ step.messages }
						visible={ currentStep >= index }
						options={ step.options || [] }
						onSelect={ step.onSelect ? step.onSelect : () => {} }
					/>
				) ) }
				<div ref={ stepsEndRef } />
			</div>

			<div className="seo-assistant-wizard__input-container">
				{ currentStep === 1 && (
					<TextInput
						ref={ keywordsInputRef }
						placeholder={ steps[ 1 ].placeholder }
						value={ steps[ 1 ].value }
						setValue={ steps[ 1 ].setValue }
						handleSubmit={ steps[ 1 ].onSubmit }
					/>
				) }
				{ currentStep === 2 && (
					<OptionsInput
						disabled={ ! steps[ 2 ].value }
						submitCtaLabel={ steps[ 2 ].submitCtaLabel }
						retryCtaLabel={ steps[ 2 ].retryCtaLabel }
						handleRetry={ steps[ 2 ].onRetry }
						handleSubmit={ steps[ 2 ].onSubmit }
					/>
				) }
			</div>
		</div>
	);
}
