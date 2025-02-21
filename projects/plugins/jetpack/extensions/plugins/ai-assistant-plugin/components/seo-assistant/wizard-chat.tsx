/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Icon, Tooltip, Notice } from '@wordpress/components';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, closeSmall, chevronLeft } from '@wordpress/icons';
import clsx from 'clsx';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { OptionsInput, TextInput, CompletionInput } from './wizard-input';
import WizardStep from './wizard-step';
import type { Step, OptionMessage } from './types';

const debug = debugFactory( 'jetpack-wizard-chat' );

const disableSkip = true;
const disableBack = true;

const errorMessageWithSkip = __(
	'Something went wrong. Please try again or skip this step.',
	'jetpack'
);
const errorMessageWithoutSkip = __( 'Something went wrong. Please try again.', 'jetpack' );
const errorMessage = disableSkip ? errorMessageWithoutSkip : errorMessageWithSkip;

export default function WizardChat( { close, steps, assistantName } ) {
	const [ currentStep, setCurrentStep ] = useState( 0 );
	const [ isBusy, setIsBusy ] = useState( false );
	const stepsEndRef = useRef( null );
	const scrollToBottom = () => {
		stepsEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};

	const prevStepIdRef = useRef< string | undefined >();
	const [ results, setResults ] = useState( {} );
	const { tracks } = useAnalytics();

	useEffect( () => {
		scrollToBottom();
	} );

	const [ currentStepData, setCurrentStepData ] = useState< Step >( steps[ 0 ] );
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
			const completion =
				steps.reduce( ( acc, step ) => {
					if ( step.includeInResults && results[ step.id ]?.value ) {
						acc++;
					}
					return acc;
				}, 0 ) / steps.filter( step => step.includeInResults ).length;

			tracks.recordEvent( 'jetpack_wizard_chat_close', {
				completion,
				step: steps[ currentStep ].id,
				steps: steps.length - 1,
				step_number: currentStep,
				placement: isCloseButton ? 'close' : 'done',
				assistant_name: assistantName,
			} );
			close();
			setCurrentStep( 0 );
		},
		[ close, currentStep, steps, tracks, results, assistantName ]
	);

	const jumpToStep = useCallback(
		( stepNumber: number ) => {
			if ( stepNumber < steps.length - 1 ) {
				tracks.recordEvent( 'jetpack_wizard_chat_jump', {
					step_from: steps[ currentStep ]?.id,
					step_to: steps[ stepNumber ]?.id,
					assistant_name: assistantName,
				} );
				setAssistantFlowAction( 'jump' );
				setCurrentStep( stepNumber );
				setCurrentStepData( steps[ stepNumber ] );
			}
		},
		[ steps, tracks, currentStep, assistantName ]
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
			tracks.recordEvent( 'jetpack_wizard_chat_back', {
				step_from: steps[ currentStep ]?.id,
				step_to: steps[ currentStep - 1 ]?.id,
				assistant_name: assistantName,
			} );
			steps[ currentStep ].resetState?.();
			setCurrentStep( currentStep - 1 );
			setCurrentStepData( steps[ currentStep - 1 ] );
		}
	};

	const handleSkip = useCallback( async () => {
		setIsBusy( true );
		setAssistantFlowAction( 'skip' );
		debug( 'skipping step', currentStep );
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
		tracks.recordEvent( 'jetpack_wizard_chat_skip', {
			step_from: steps[ currentStep ]?.id,
			step_to: steps[ currentStep + 1 ]?.id,
			assistant_name: assistantName,
		} );
		if ( steps[ currentStep ]?.type === 'completion' ) {
			handleDone();
		} else {
			handleNext();
		}
	}, [ currentStep, steps, handleNext, results, handleDone, tracks, assistantName ] );

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
		tracks.recordEvent( 'jetpack_wizard_chat_submit', {
			step_from: steps[ currentStep ].id,
			step_to: steps[ currentStep + 1 ].id,
			value_length: stepValue?.length || 0,
			assistant_name: assistantName,
		} );

		handleNext();
	}, [ currentStep, handleDone, handleNext, steps, tracks, handleSkip, assistantName ] );

	const handleRetry = useCallback( async () => {
		tracks.recordEvent( 'jetpack_wizard_chat_retry', {
			step: steps[ currentStep ]?.id,
			assistant_name: assistantName,
		} );
		setIsBusy( true );
		await steps[ currentStep ].onRetry?.( {} );
		setIsBusy( false );
	}, [ currentStep, steps, tracks, assistantName ] );

	return (
		<div className="jetpack-wizard-chat">
			<div className="jetpack-wizard-chat__header">
				<div className="jetpack-wizard-chat__header-actions">
					{ ! disableBack && (
						<Button variant="link" disabled={ isBusy } onClick={ handleBack }>
							<Icon icon={ chevronLeft } size={ 32 } />
						</Button>
					) }
				</div>
				<h2>{ currentStepData?.title }</h2>
				<div className={ clsx( 'jetpack-wizard-chat__header-actions', 'header-actions--right' ) }>
					{ ! disableSkip && (
						<Tooltip text={ __( 'Skip', 'jetpack' ) }>
							<Button
								variant="link"
								disabled={ isBusy || currentStep >= steps.length - 1 }
								onClick={ handleSkip }
							>
								<Icon icon={ next } size={ 32 } />
							</Button>
						</Tooltip>
					) }
					<Button variant="link" onClick={ () => handleDone( true ) }>
						<Icon icon={ closeSmall } size={ 32 } />
					</Button>
				</div>
			</div>

			<div className="jetpack-wizard-chat__content">
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
						{ errorMessage }
					</Notice>
				) }
				<div ref={ stepsEndRef } />
			</div>

			<div className="jetpack-wizard-chat__input-container">
				{ steps[ currentStep ].type === 'input' && (
					<TextInput
						ref={ steps[ currentStep ].inputRef }
						placeholder={ steps[ currentStep ].placeholder }
						value={ steps[ currentStep ].rawInput }
						setValue={ steps[ currentStep ].setRawInput }
						handleSubmit={ handleStepSubmit }
					/>
				) }
				{ steps[ currentStep ].type === 'options' && (
					<OptionsInput
						disabled={ ! steps[ currentStep ].hasSelection }
						loading={ isBusy }
						submitCtaLabel={ steps[ currentStep ].submitCtaLabel }
						retryCtaLabel={ steps[ currentStep ].retryCtaLabel }
						handleRetry={ handleRetry }
						handleSubmit={ handleStepSubmit }
					/>
				) }
				{ steps[ currentStep ].type === 'completion' && (
					<CompletionInput
						submitCtaLabel={ steps[ currentStep ].submitCtaLabel }
						handleSubmit={ handleStepSubmit }
					/>
				) }
			</div>
		</div>
	);
}
