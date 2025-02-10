import { Button, Icon, Tooltip } from '@wordpress/components';
import { useState, useEffect, useRef, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, closeSmall, chevronLeft } from '@wordpress/icons';
import debugFactory from 'debug';
import { useCompletionStep } from './use-completion-step';
import { useKeywordsStep } from './use-keywords-step';
import { useMetaDescriptionStep } from './use-meta-description-step';
import { useTitleStep } from './use-title-step';
import { useWelcomeStep } from './use-welcome-step';
import { OptionsInput, TextInput, CompletionInput } from './wizard-input';
import WizardStep from './wizard-step';
import type { Step, OptionMessage } from './types';

const debug = debugFactory( 'jetpack-seo:assistant-wizard' );

export default function AssistantWizard( { close } ) {
	const [ currentStep, setCurrentStep ] = useState( 0 );
	const [ isBusy, setIsBusy ] = useState( false );
	const stepsEndRef = useRef( null );
	const scrollToBottom = () => {
		stepsEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};
	const keywordsInputRef = useRef( null );
	const prevStepIdRef = useRef< string | undefined >();
	const [ results, setResults ] = useState( {} );

	useEffect( () => {
		scrollToBottom();
	} );

	// Keywords
	const keywordsStepData = useKeywordsStep();
	const titleStepData = useTitleStep( { keywords: keywordsStepData.value, mockRequests: false } );
	const metaStepData = useMetaDescriptionStep( {
		keywords: keywordsStepData.value,
		mockRequests: false,
	} );
	const completionStepData = useCompletionStep();
	const welcomeStepData = useWelcomeStep();
	// Memoize steps array to prevent unnecessary recreations
	const steps = useMemo(
		() => [ welcomeStepData, keywordsStepData, titleStepData, metaStepData, completionStepData ],
		[ welcomeStepData, keywordsStepData, titleStepData, metaStepData, completionStepData ]
	);
	const [ currentStepData, setCurrentStepData ] = useState< Step >( welcomeStepData );
	const [ assistantFlowAction, setAssistantFlowAction ] = useState( '' );

	const stepsCount = steps.length;

	const handleStepStart = useCallback( async () => {
		debug( 'handleStepStart', currentStepData?.id );
		if ( ! currentStepData || ! currentStepData.onStart ) {
			return;
		}
		if ( assistantFlowAction !== 'backwards' ) {
			await currentStepData?.onStart( {
				fromSkip: assistantFlowAction === 'skip',
				results,
			} );
		}
		setIsBusy( false );
	}, [ currentStepData, assistantFlowAction, results ] );

	const handleNext = useCallback( () => {
		debug( 'handleNext, stepsCount', stepsCount );
		let nextStep;
		setCurrentStep( prev => {
			if ( prev + 1 < stepsCount ) {
				nextStep = prev + 1;
				debug( 'moving to ' + nextStep );
				setCurrentStepData( steps[ nextStep ] );
				return nextStep;
			}
			return prev;
		} );
	}, [ stepsCount, steps ] );

	useEffect( () => {
		const currentId = currentStepData?.id;

		if ( prevStepIdRef.current !== currentId ) {
			debug( 'currentStepData changed', currentId );
			handleStepStart();
		}

		prevStepIdRef.current = currentId;
	}, [ currentStepData, handleStepStart ] );

	// Initialize current step data
	useEffect( () => {
		if ( currentStep === 0 && steps[ 0 ].autoAdvance ) {
			debug( 'init assistant wizard' );
			setIsBusy( true );
			setAssistantFlowAction( 'forwards' );
			const timeout = setTimeout( handleNext, steps[ 0 ].autoAdvance );
			return () => clearTimeout( timeout );
		}
	}, [ currentStep, handleNext, steps ] );

	// Reset states and close the wizard
	const handleDone = useCallback( () => {
		close();
		setCurrentStep( 0 );
	}, [ close ] );

	const handleStepSubmit = useCallback( async () => {
		debug( 'step submitted' );
		setIsBusy( true );
		const stepValue = await steps[ currentStep ]?.onSubmit?.();
		debug( 'stepValue', stepValue );
		if ( steps[ currentStep ].includeInResults ) {
			const newResults = {
				[ steps[ currentStep ].id ]: {
					value: stepValue?.trim?.(),
					type: steps[ currentStep ].type,
					label: steps[ currentStep ].label,
				},
			};
			debug( 'newResults', newResults );
			setResults( prev => ( { ...prev, ...newResults } ) );
		}
		setAssistantFlowAction( 'submit' );

		if ( steps[ currentStep ]?.type === 'completion' ) {
			debug( 'completion step, closing wizard' );
			handleDone();
		} else {
			debug( 'step type', steps[ currentStep ]?.type );
			handleNext();
		}
	}, [ currentStep, handleDone, handleNext, steps ] );

	const jumpToStep = useCallback(
		( stepNumber: number ) => {
			if ( stepNumber < steps.length - 1 ) {
				setAssistantFlowAction( 'jump' );
				setCurrentStep( stepNumber );
				setCurrentStepData( steps[ stepNumber ] );
			}
		},
		[ steps ]
	);

	const handleSelect = useCallback(
		( stepNumber: number, option: OptionMessage ) => {
			if ( stepNumber !== currentStep ) {
				jumpToStep( stepNumber );
			}
			steps[ stepNumber ].onSelect?.( option );
		},
		[ currentStep, jumpToStep, steps ]
	);

	const handleBack = () => {
		if ( currentStep > 1 ) {
			setIsBusy( true );
			setAssistantFlowAction( 'backwards' );
			debug( 'moving back to ' + ( currentStep - 1 ) );
			setCurrentStep( currentStep - 1 );
			setCurrentStepData( steps[ currentStep - 1 ] );
		}
	};

	const handleSkip = useCallback( async () => {
		setIsBusy( true );
		setAssistantFlowAction( 'skip' );
		await steps[ currentStep ]?.onSkip?.();
		const step = steps[ currentStep ];
		if ( ! results[ step.id ] && step.includeInResults ) {
			setResults( prev => ( {
				...prev,
				[ step.id ]: {
					value: '',
					type: step.type,
					label: step.label,
				},
			} ) );
		}
		if ( steps[ currentStep ]?.type === 'completion' ) {
			debug( 'completion step, closing wizard' );
			handleDone();
		} else {
			debug( 'step type', steps[ currentStep ]?.type );
			handleNext();
		}
	}, [ currentStep, steps, handleNext, results, handleDone ] );

	const handleRetry = useCallback( async () => {
		debug( 'handleRetry' );
		setIsBusy( true );
		await steps[ currentStep ].onRetry?.();
		setIsBusy( false );
	}, [ currentStep, steps ] );

	return (
		<div className="assistant-wizard">
			<div className="assistant-wizard__header">
				<div className="assistant-wizard__header-actions">
					<Button variant="link" disabled={ isBusy } onClick={ handleBack }>
						<Icon icon={ chevronLeft } size={ 32 } />
					</Button>
				</div>
				<h2>{ currentStepData?.title }</h2>
				<div className="assistant-wizard__header-actions">
					<Tooltip text={ __( 'Skip', 'jetpack' ) }>
						<Button
							variant="link"
							disabled={ isBusy || currentStep >= steps.length - 1 }
							onClick={ handleSkip }
						>
							<Icon icon={ next } size={ 32 } />
						</Button>
					</Tooltip>
					<Button variant="link" onClick={ handleDone }>
						<Icon icon={ closeSmall } size={ 32 } />
					</Button>
				</div>
			</div>

			<div className="assistant-wizard__content">
				{ steps.map( ( step, index ) => (
					<WizardStep
						key={ step.id }
						messages={ step.messages }
						visible={ currentStep >= index }
						onSelect={ option => handleSelect( index, option ) }
						current={ currentStep === index }
						isBusy={ isBusy }
					/>
				) ) }
				<div ref={ stepsEndRef } />
			</div>

			<div className="assistant-wizard__input-container">
				{ currentStep === 1 && steps[ currentStep ].type === 'input' && (
					<TextInput
						ref={ keywordsInputRef }
						placeholder={ steps[ currentStep ].placeholder }
						value={ steps[ currentStep ].rawInput }
						setValue={ steps[ currentStep ].setRawInput }
						handleSubmit={ handleStepSubmit }
					/>
				) }
				{ currentStep === 2 && steps[ currentStep ].type === 'options' && (
					<OptionsInput
						disabled={ ! steps[ currentStep ].hasSelection }
						submitCtaLabel={ steps[ currentStep ].submitCtaLabel }
						retryCtaLabel={ steps[ currentStep ].retryCtaLabel }
						handleRetry={ handleRetry }
						handleSubmit={ handleStepSubmit }
					/>
				) }
				{ currentStep === 3 && steps[ currentStep ].type === 'options' && (
					<OptionsInput
						disabled={ ! steps[ currentStep ].hasSelection }
						submitCtaLabel={ steps[ currentStep ].submitCtaLabel }
						retryCtaLabel={ steps[ currentStep ].retryCtaLabel }
						handleRetry={ handleRetry }
						handleSubmit={ handleStepSubmit }
					/>
				) }
				{ currentStep === steps.length - 1 && (
					<CompletionInput
						submitCtaLabel={ steps[ currentStep ].submitCtaLabel }
						handleSubmit={ handleStepSubmit }
					/>
				) }
			</div>
		</div>
	);
}
