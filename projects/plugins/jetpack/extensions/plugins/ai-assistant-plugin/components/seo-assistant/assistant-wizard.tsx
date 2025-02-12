import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Icon, Tooltip, Notice } from '@wordpress/components';
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
	const { tracks } = useAnalytics();

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
		// If the step is backwards, we don't want to start the step again, unless it failed before and has no options
		if ( assistantFlowAction !== 'backwards' || steps[ currentStep ]?.options?.length === 0 ) {
			await currentStepData?.onStart( {
				fromSkip: assistantFlowAction === 'skip',
				results,
			} );
		}
		setIsBusy( false );
	}, [ currentStepData, assistantFlowAction, steps, currentStep, results ] );

	const handleNext = useCallback( () => {
		debug( 'handleNext, stepsCount', stepsCount );
		let nextStep: number;

		steps[ currentStep ].resetState?.();

		setCurrentStep( prev => {
			if ( prev + 1 < stepsCount ) {
				nextStep = prev + 1;
				debug( 'moving to ' + nextStep );
				setCurrentStepData( steps[ nextStep ] );
				return nextStep;
			}
			return prev;
		} );
	}, [ stepsCount, steps, currentStep ] );

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
	const handleDone = useCallback(
		( isCloseButton = false ) => {
			debug( isCloseButton );
			const completion =
				steps.reduce( ( acc, step ) => {
					if ( step.includeInResults && results[ step.id ]?.value ) {
						acc++;
					}
					return acc;
				}, 0 ) / steps.filter( step => step.includeInResults ).length;

			tracks.recordEvent( 'jetpack_seo_assistant_close', {
				completion,
				step: steps[ currentStep ].id,
				steps: steps.length - 1,
				step_number: currentStep,
				placement: isCloseButton ? 'close' : 'done',
			} );
			close();
			setCurrentStep( 0 );
		},
		[ close, currentStep, steps, tracks, results ]
	);

	const jumpToStep = useCallback(
		( stepNumber: number ) => {
			if ( stepNumber < steps.length - 1 ) {
				tracks.recordEvent( 'jetpack_seo_assistant_step_jump', {
					step_from: steps[ currentStep ]?.id,
					step_to: steps[ stepNumber ]?.id,
				} );
				setAssistantFlowAction( 'jump' );
				setCurrentStep( stepNumber );
				setCurrentStepData( steps[ stepNumber ] );
			}
		},
		[ steps, tracks, currentStep ]
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
			tracks.recordEvent( 'jetpack_seo_assistant_step_back', {
				step_from: steps[ currentStep ]?.id,
				step_to: steps[ currentStep - 1 ]?.id,
			} );
			steps[ currentStep ].resetState?.();
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
		tracks.recordEvent( 'jetpack_seo_assistant_step_skip', {
			step_from: steps[ currentStep ]?.id,
			step_to: steps[ currentStep + 1 ]?.id,
		} );
		if ( steps[ currentStep ]?.type === 'completion' ) {
			debug( 'completion step, closing wizard' );
			handleDone();
		} else {
			debug( 'step type', steps[ currentStep ]?.type );
			handleNext();
		}
	}, [ currentStep, steps, handleNext, results, handleDone, tracks ] );

	const handleStepSubmit = useCallback( async () => {
		debug( 'step submitted' );
		if ( steps[ currentStep ]?.type === 'completion' ) {
			debug( 'completion step, closing wizard' );
			handleDone();
			return;
		}

		setIsBusy( true );
		const stepValue = await steps[ currentStep ]?.onSubmit?.();
		if ( ! stepValue?.trim?.() ) {
			return handleSkip();
		}
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
		tracks.recordEvent( 'jetpack_seo_assistant_step_submit', {
			step_from: steps[ currentStep ].id,
			step_to: steps[ currentStep + 1 ].id,
			value_length: stepValue?.length || 0,
		} );

		debug( 'step type', steps[ currentStep ]?.type );
		handleNext();
	}, [ currentStep, handleDone, handleNext, steps, tracks, handleSkip ] );

	const handleRetry = useCallback( async () => {
		debug( 'handleRetry' );
		tracks.recordEvent( 'jetpack_seo_assistant_step_retry', {
			step: steps[ currentStep ]?.id,
		} );
		setIsBusy( true );
		await steps[ currentStep ].onRetry?.( {} );
		setIsBusy( false );
	}, [ currentStep, steps, tracks ] );

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
					<Button variant="link" onClick={ () => handleDone( true ) }>
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

				{ steps[ currentStep ].hasFailed && (
					<Notice status="error" isDismissible={ false }>
						{ __( 'Something went wrong. Please try again or skip this step.', 'jetpack' ) }
					</Notice>
				) }
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
						loading={ isBusy }
						submitCtaLabel={ steps[ currentStep ].submitCtaLabel }
						retryCtaLabel={ steps[ currentStep ].retryCtaLabel }
						handleRetry={ handleRetry }
						handleSubmit={ handleStepSubmit }
					/>
				) }
				{ currentStep === 3 && steps[ currentStep ].type === 'options' && (
					<OptionsInput
						disabled={ ! steps[ currentStep ].hasSelection }
						loading={ isBusy }
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
