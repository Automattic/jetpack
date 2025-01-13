import { useState, useCallback, useEffect, useRef, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import './style.scss';
import { useCompletionStep } from './use-completion-step';
import { useKeywordsStep } from './use-keywords-step';
import { useMetaDescriptionStep } from './use-meta-description-step';
import { useTitleStep } from './use-title-step';
import WizardInput from './wizard-input';
import WizardMessages from './wizard-messages';
import type { SeoAssistantProps, Step, Message } from './types';

const debug = debugFactory( 'jetpack-ai:seo-assistant-wizard' );

export default function SeoAssistantWizard( { isOpen, close, onStep }: SeoAssistantProps ) {
	const [ currentStep, setCurrentStep ] = useState( 0 );
	const [ messages, setMessages ] = useState< Message[] >( [] );
	const messagesEndRef = useRef< HTMLDivElement >( null );
	const [ isBusy, setIsBusy ] = useState( false );

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};

	useEffect( () => {
		scrollToBottom();
	}, [ messages ] );

	const addMessage = useCallback( async ( message: Message | string ) => {
		setMessages( prev => {
			const newMessage = {
				id:
					typeof message === 'string'
						? `message-${ prev.length }`
						: message?.id || `message-${ prev.length }`,
				content: typeof message === 'string' ? message : message.content,
				isUser: typeof message === 'string' ? false : message?.isUser || false,
				showIcon: typeof message === 'string' ? true : message?.showIcon ?? ! message.isUser,
				type: typeof message === 'string' ? null : message?.type || null,
				options: typeof message === 'string' ? [] : message?.options || [],
			} as Message;
			return [ ...prev, newMessage ];
		} );
	}, [] );

	/* Removes last message */
	const removeLastMessage = () => {
		setMessages( prev => prev.slice( 0, -1 ) );
	};

	const keywordsStep: Step = useKeywordsStep( {
		addMessage,
		onStep,
	} );

	const titleStep: Step = useTitleStep( {
		addMessage,
		removeLastMessage,
		onStep,
		contextData: keywordsStep.value,
		setIsBusy,
	} );

	const metaStep: Step = useMetaDescriptionStep( {
		addMessage,
		removeLastMessage,
		onStep,
		setIsBusy,
	} );

	const completionStep: Step = useCompletionStep( {
		steps: [ keywordsStep, titleStep, metaStep ],
		addMessage,
	} );

	const steps: Step[] = useMemo(
		() => [
			keywordsStep,
			titleStep,
			metaStep,
			// {
			// 	id: 'completion',
			// 	title: __( 'Your post is SEO-ready', 'jetpack' ),
			// 	// onStart: handleSummaryChecks,
			// 	messages: [
			// 		{
			// 			content: __( "Here's your updated checklist:", 'jetpack' ),
			// 			showIcon: true,
			// 		},
			// 	],
			// 	type: 'completion',
			// 	value: '',
			// 	setValue: () => {},
			// },
			completionStep,
		],
		[ keywordsStep, metaStep, titleStep, completionStep ]
	);

	const currentStepData = steps[ currentStep ];

	// initialize wizard, set completion monitors
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}
		if ( messages.length === 0 ) {
			debug( 'init' );
			// Initialize with first step messages
			currentStepData.messages.forEach( message =>
				addMessage( {
					content: message.content,
					showIcon: message.showIcon,
				} )
			);
		}
	}, [ isOpen, currentStepData.messages, messages, addMessage ] );

	const handleNext = useCallback( () => {
		if ( currentStep < steps.length - 1 ) {
			debug( 'moving to ' + ( currentStep + 1 ), steps[ currentStep + 1 ] );
			setCurrentStep( currentStep + 1 );
			// Add next step messages
			// TODO: can we capture completion step here and craft the messages?
			// Nothing else has worked so far to keep track of step completions
			steps[ currentStep + 1 ].messages.forEach( message =>
				addMessage( {
					content: message.content,
					showIcon: message.showIcon,
				} )
			);
			// If we're on last step, process completion
			// if ( currentStep + 1 === steps.length - 1 ) {
			// 	addMessage( {
			// 		content: createInterpolateElement(
			// 			steps
			// 				.filter( step => step.type !== 'completion' )
			// 				.map( step => {
			// 					const label = step.label || step.title;
			// 					return step.completed ? `✅ ${ label }` : `❌ ${ label }`;
			// 				} )
			// 				.join( '<br />' ),
			// 			{ br: <br /> }
			// 		),
			// 		showIcon: false,
			// 	} );
			// 	addMessage( {
			// 		content: createInterpolateElement(
			// 			__(
			// 				'SEO optimization complete! 🎉<br/>Your blog post is now search-engine friendly.',
			// 				'jetpack'
			// 			),
			// 			{ br: <br /> }
			// 		),
			// 		showIcon: true,
			// 	} );
			// 	addMessage( {
			// 		content: __( 'Happy blogging! 😊', 'jetpack' ),
			// 		showIcon: false,
			// 	} );
			// }
			steps[ currentStep + 1 ].onStart?.();
		}
	}, [ currentStep, steps, setCurrentStep, addMessage ] );

	const handleSubmit = useCallback( async () => {
		await currentStepData.onSubmit?.();
		handleNext();
	}, [ currentStepData, handleNext ] );

	const handleBack = () => {
		if ( currentStep > 0 ) {
			setCurrentStep( currentStep - 1 );
			// Re-add previous step messages
			steps[ currentStep - 1 ].messages.forEach( message =>
				addMessage( {
					content: message.content,
					showIcon: message.showIcon,
				} )
			);
		}
	};

	const handleSkip = async () => {
		await currentStepData?.onSkip?.();
		handleNext();
	};

	// Reset states and close the wizard
	const handleDone = useCallback( () => {
		close();
		setCurrentStep( 0 );
		setMessages( [] );
		steps
			.filter( step => step.type !== 'completion' )
			.forEach( step => step.setCompleted( false ) );
	}, [ close, steps ] );

	return (
		isOpen && (
			<div className="seo-assistant-wizard">
				<div className="seo-assistant-wizard__header">
					<button className="seo-assistant-wizard__back" onClick={ handleBack }>
						{ __( '←', 'jetpack' ) }
					</button>
					<h2>{ currentStepData.title }</h2>
					<button disabled={ isBusy } className="seo-assistant-wizard__skip" onClick={ handleSkip }>
						{ __( 'Skip', 'jetpack' ) }
					</button>
				</div>

				<div className="seo-assistant-wizard__content">
					<WizardMessages currentStepData={ currentStepData } messages={ messages } />

					<WizardInput
						currentStepData={ currentStepData }
						handleDone={ handleDone }
						handleSubmit={ handleSubmit }
					/>
				</div>
			</div>
		)
	);
}
