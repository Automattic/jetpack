import { Button, Icon, Tooltip } from '@wordpress/components';
import { useState, useEffect, useRef, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, closeSmall, chevronLeft } from '@wordpress/icons';
import debugFactory from 'debug';
import { useKeywordsStep } from './use-keywords-step';
import { useMetaDescriptionStep } from './use-meta-description-step';
import { useTitleStep } from './use-title-step';
import { OptionsInput, TextInput, CompletionInput } from './wizard-input';
import WizardStep from './wizard-step';
import type { Step, Option } from './types';

const debug = debugFactory( 'jetpack-seo:assistant-wizard' );

export default function AssistantWizard( { close, tasks } ) {
	const [ currentStep, setCurrentStep ] = useState( 0 );
	const [ currentStepData, setCurrentStepData ] = useState< Step >();
	const [ isBusy ] = useState( false );
	const stepsEndRef = useRef( null );
	const scrollToBottom = () => {
		stepsEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};
	const keywordsInputRef = useRef( null );

	useEffect( () => {
		scrollToBottom();
	}, [ currentStep ] );

	// Keywords
	const keywordsStepData = useKeywordsStep();
	const titleStepData = useTitleStep();
	const metaStepData = useMetaDescriptionStep();

	// Memoize steps array to prevent unnecessary recreations
	const steps = useMemo(
		() => [ tasks[ 0 ], keywordsStepData, titleStepData, metaStepData, tasks[ 1 ] ],
		[ tasks, keywordsStepData, titleStepData, metaStepData ]
	);

	const handleNext = useCallback( () => {
		if ( currentStep + 1 < steps.length ) {
			debug( 'moving to ' + ( currentStep + 1 ) );
			setCurrentStep( currentStep + 1 );
			setCurrentStepData( steps[ currentStep + 1 ] );
			steps[ currentStep + 1 ].onStart?.();
		}
	}, [ currentStep, steps ] );

	const handleStepSubmit = useCallback( async () => {
		await steps[ currentStep ]?.onSubmit?.();
		debug( 'step submitted, moving next' );
		// always give half a second before moving forward
		setTimeout( handleNext, 500 );
	}, [ currentStep, handleNext, steps ] );

	const jumpToStep = useCallback(
		stepNumber => {
			if ( stepNumber < steps.length - 1 ) {
				setCurrentStep( stepNumber );
				setCurrentStepData( stepNumber );
			}
		},
		[ steps ]
	);

	const handleSelect = useCallback(
		( stepNumber: number, option: Option ) => {
			if ( stepNumber !== currentStep ) {
				jumpToStep( stepNumber );
			}
			steps[ stepNumber ].onSelect?.( option );
		},
		[ currentStep, jumpToStep, steps ]
	);

	// Initialize current step data
	useEffect( () => {
		if ( currentStep === 0 ) {
			setCurrentStepData( steps[ 0 ] );
			if ( steps[ 0 ].autoAdvance ) {
				setTimeout( handleNext, steps[ 0 ].autoAdvance );
			}
		}
	}, [ currentStep, steps, handleNext ] );

	const handleBack = () => {
		if ( currentStep > 1 ) {
			debug( 'moving to ' + ( currentStep - 1 ) );
			setCurrentStep( currentStep - 1 );
			setCurrentStepData( steps[ currentStep - 1 ] );
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
		<div className="assistant-wizard">
			<div className="assistant-wizard__header">
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

			<div className="assistant-wizard__content" style={ { overflow: 'auto' } }>
				{ steps.map( ( step, index ) => (
					<WizardStep
						key={ step.id }
						messages={ step.messages }
						visible={ currentStep >= index }
						options={ step.options || [] }
						onSelect={ option => handleSelect( index, option ) }
					/>
				) ) }
				<div ref={ stepsEndRef } />
			</div>

			<div className="assistant-wizard__input-container">
				{ currentStep === 1 && (
					<TextInput
						ref={ keywordsInputRef }
						placeholder={ steps[ currentStep ].placeholder }
						value={ steps[ currentStep ].value }
						setValue={ steps[ currentStep ].setValue }
						handleSubmit={ handleStepSubmit }
					/>
				) }
				{ currentStep === 2 && (
					<OptionsInput
						disabled={ ! steps[ currentStep ].value }
						submitCtaLabel={ steps[ currentStep ].submitCtaLabel }
						retryCtaLabel={ steps[ currentStep ].retryCtaLabel }
						handleRetry={ steps[ currentStep ].onRetry }
						handleSubmit={ handleStepSubmit }
					/>
				) }
				{ currentStep === 3 && (
					<OptionsInput
						disabled={ ! steps[ currentStep ].value }
						submitCtaLabel={ steps[ currentStep ].submitCtaLabel }
						retryCtaLabel={ steps[ currentStep ].retryCtaLabel }
						handleRetry={ steps[ currentStep ].onRetry }
						handleSubmit={ handleStepSubmit }
					/>
				) }
				{ currentStep === steps.length - 1 && (
					<CompletionInput
						submitCtaLabel={ steps[ currentStep ].submitCtaLabel }
						handleSubmit={ steps[ currentStep ].onSubmit }
					/>
				) }
			</div>
		</div>
	);
}
