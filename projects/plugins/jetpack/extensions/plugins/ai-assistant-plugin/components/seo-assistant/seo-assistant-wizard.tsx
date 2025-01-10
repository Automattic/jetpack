import {
	useState,
	useCallback,
	useEffect,
	useRef,
	useMemo,
	createInterpolateElement,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import debugFactory from 'debug';
import './style.scss';
import bigSkyIcon from './big-sky-icon.svg';
// import { useCompletionStep } from './use-completion-step';
import { useKeywordsStep } from './use-keywords-step';
import { useMetaDescriptionStep } from './use-meta-description-step';
import { useTitleStep } from './use-title-step';
import WizardInput from './wizard-input';
import type { SeoAssistantProps, Step, Message } from './types';

const debug = debugFactory( 'jetpack-ai:seo-assistant-wizard' );

export default function SeoAssistantWizard( { isOpen, close, onStep }: SeoAssistantProps ) {
	const [ currentStep, setCurrentStep ] = useState( 0 );
	const [ messages, setMessages ] = useState< Message[] >( [] );
	const messagesEndRef = useRef< HTMLDivElement >( null );
	const [ isBusy, setIsBusy ] = useState( false );
	const [ monitors, setMonitors ] = useState( [] );

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

	const addMonitor = step => setMonitors( prev => [ ...prev, step ] );

	const updateMonitor = useCallback(
		step =>
			setMonitors( prev =>
				prev.map( ( stepMonitor: { id: string } ) => {
					return step.id === stepMonitor.id
						? {
								...stepMonitor,
								...step,
						  }
						: stepMonitor;
				} )
			),
		[ setMonitors ]
	);

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

	// const completionStep: Step = useCompletionStep( {
	// 	steps: [ keywordsStep, titleStep, metaStep ],
	// 	addMessage,
	// } );

	const steps: Step[] = useMemo(
		() => [
			keywordsStep,
			titleStep,
			metaStep,
			{
				id: 'completion',
				title: __( 'Your post is SEO-ready', 'jetpack' ),
				// onStart: handleSummaryChecks,
				messages: [
					{
						content: __( "Here's your updated checklist:", 'jetpack' ),
						showIcon: true,
					},
					{
						content: createInterpolateElement(
							monitors
								.map( stepMonitor =>
									stepMonitor.completed ? `✅ ${ stepMonitor.label }` : `❌ ${ stepMonitor.label }`
								)
								.join( '<br />' ),
							{ br: <br /> }
						),
						showIcon: false,
					},
					{
						content: createInterpolateElement(
							__(
								'SEO optimization complete! 🎉<br/>Your blog post is now search-engine friendly.',
								'jetpack'
							),
							{ br: <br /> }
						),
						showIcon: true,
					},
					{
						content: __( 'Happy blogging! 😊', 'jetpack' ),
						showIcon: false,
					},
				],
				type: 'completion',
				value: '',
				setValue: () => {},
			},
		],
		[ keywordsStep, titleStep, metaStep, monitors ]
	);

	const currentStepData = useMemo( () => steps[ currentStep ], [ steps, currentStep ] );

	// initialize wizard, set completion monitors
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}
		if ( messages.length === 0 ) {
			debug( 'init' );
			// Initialize the completion monitor
			steps
				.filter( step => step.type !== 'completion' )
				.forEach( step => {
					addMonitor( {
						id: step.id,
						label: step.label || step.title,
						completed: false,
					} );
				} );
			// Initialize with first step messages
			currentStepData.messages.forEach( message =>
				addMessage( {
					content: message.content,
					showIcon: message.showIcon,
				} )
			);
		}
	}, [ isOpen, currentStepData.messages, messages, addMessage, steps ] );

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
			steps[ currentStep + 1 ].onStart?.();
		}
	}, [ currentStep, steps, setCurrentStep, addMessage ] );

	const handleSubmit = useCallback( async () => {
		await currentStepData.onSubmit?.();
		updateMonitor( {
			id: currentStepData.id,
			completed: true,
		} );
		handleNext();
	}, [ currentStepData, updateMonitor, handleNext ] );

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
		setMonitors( [] );
	}, [ close ] );

	const renderMessageText = message => {
		if ( message.type === 'past-options' ) {
			return (
				<div className="seo-assistant-wizard__options">
					{ message.options.map( option => (
						<div
							key={ option.id }
							className={ clsx( 'seo-assistant-wizard__option', {
								'is-selected': option.selected,
							} ) }
						>
							{ option.content }
						</div>
					) ) }
				</div>
			);
		}

		return <div className="seo-assistant-wizard__message-text">{ message.content }</div>;
	};

	const renderMessages = () => {
		return messages.map( message => (
			<div
				key={ message.id }
				className={ clsx( 'seo-assistant-wizard__message', {
					'is-user': message.isUser,
				} ) }
			>
				<div className="seo-assistant-wizard__message-icon">
					{ message.showIcon && (
						<img src={ bigSkyIcon } alt={ __( 'SEO Assistant avatar', 'jetpack' ) } />
					) }
				</div>
				{ renderMessageText( message ) }
			</div>
		) );
	};

	const renderOptions = () => {
		if ( currentStepData.type !== 'options' || ! currentStepData.options.length ) {
			return null;
		}

		return (
			<div className="seo-assistant-wizard__message">
				<div className="seo-assistant-wizard__message-icon"></div>
				<div className="seo-assistant-wizard__message-text">
					<div className="seo-assistant-wizard__options">
						{ currentStepData.options.map( option => (
							<button
								key={ option.id }
								className={ clsx( 'seo-assistant-wizard__option', {
									'is-selected': option.selected,
								} ) }
								onClick={ () => currentStepData.onSelect( option ) }
							>
								{ option.content }
							</button>
						) ) }
					</div>
				</div>
			</div>
		);
	};

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
					<div className="seo-assistant-wizard__messages">
						{ renderMessages() }
						{ renderOptions() }
						<div ref={ messagesEndRef } />
					</div>

					<div className="seo-assistant-wizard__input-container">
						<WizardInput
							currentStepData={ currentStepData }
							handleDone={ handleDone }
							handleSubmit={ handleSubmit }
						/>
					</div>
				</div>
			</div>
		)
	);
}
