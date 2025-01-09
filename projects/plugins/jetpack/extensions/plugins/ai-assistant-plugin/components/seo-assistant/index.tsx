import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { Button, TextControl, SVG, Circle, Icon } from '@wordpress/components';
import {
	useState,
	useCallback,
	useEffect,
	useRef,
	createInterpolateElement,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowRight } from '@wordpress/icons';
import clsx from 'clsx';
import debugFactory from 'debug';
import { SeoPlaceholder } from '../../../../plugins/seo/components/placeholder';
import usePostContent from '../../hooks/use-post-content';
import './style.scss';
import bigSkyIcon from './big-sky-icon.svg';
import { useKeywordsStep } from './use-keywords-step';
import { useMetaDescriptionStep } from './use-meta-description-step';
import { useTitleStep } from './use-title-step';

type StepType = 'input' | 'options' | 'completion';

export interface Message {
	id?: string;
	content?: string | React.ReactNode;
	isUser?: boolean;
	showIcon?: boolean;
	type?: string;
	options?: Option[];
}

export interface Option {
	id: string;
	content: string;
	selected?: boolean;
}

interface BaseStep {
	id: string;
	title: string;
	messages: StepMessage[];
	type: StepType;
	onStart?: () => void;
}

interface InputStep extends BaseStep {
	type: 'input';
	placeholder: string;
	onSubmit: ( value: string ) => void;
}

interface OptionsStep extends BaseStep {
	type: 'options';
	options: Option[];
	onSelect: ( option: Option ) => void;
	onSubmit?: () => void;
	submitCtaLabel?: string;
	onRetry?: () => void;
	onRetryCtaLabel?: string;
}

interface CompletionStep extends BaseStep {
	type: 'completion';
}

export type Step = InputStep | OptionsStep | CompletionStep;

interface SeoAssistantProps {
	busy?: boolean;
	disabled?: boolean;
	onStep?: ( data: { value: string | Option | null } ) => void;
}

type StepHook = {
	stepProps: Step;
	value: string | Array< string >;
	setValue:
		| React.Dispatch< React.SetStateAction< string > >
		| React.Dispatch< React.SetStateAction< Array< string > > >;
};

const debug = debugFactory( 'jetpack-ai:seo-assistant' );

export const TypingMessage = () => {
	return (
		<SVG viewBox="0 0 40 40" height="20" width="20" className="typing-loader">
			<Circle className="typing-dot" cx="10" cy="30" r="3" style={ { fill: 'grey' } } />
			<Circle className="typing-dot" cx="20" cy="30" r="3" style={ { fill: 'grey' } } />
			<Circle className="typing-dot" cx="30" cy="30" r="3" style={ { fill: 'grey' } } />
		</SVG>
	);
};

interface StepMessage {
	content: string | React.ReactNode;
	showIcon?: boolean;
}

export default function SeoAssistant( { disabled, onStep }: SeoAssistantProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ currentStep, setCurrentStep ] = useState( 0 );
	const [ messages, setMessages ] = useState< Message[] >( [] );
	const messagesEndRef = useRef< HTMLDivElement >( null );
	const postContent = usePostContent();
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'seo-tools' );

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};

	useEffect( () => {
		scrollToBottom();
	}, [ messages ] );

	const addMessage = ( message: Message | string ) => {
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
	};

	// const editMessage = useCallback( ( messageId: string, updatedMessage: Partial< Message > ) => {
	// 	setMessages( prev =>
	// 		prev.map( message =>
	// 			message.id === messageId
	// 				? {
	// 						...message,
	// 						...updatedMessage,
	// 				  }
	// 				: message
	// 		)
	// 	);
	// }, [] );

	/* Removes last message */
	const removeLastMessage = () => {
		setMessages( prev => prev.slice( 0, -1 ) );
	};

	const handleDone = useCallback( () => {
		setIsOpen( false );
		setCurrentStep( 0 );
		setMessages( [] );
	}, [] );

	const {
		stepProps: keywordsStep,
		value: keywords,
		setValue: setKeywords,
	}: StepHook = useKeywordsStep( {
		addMessage,
		onStep,
	} );

	const { stepProps: titleStep }: StepHook = useTitleStep( {
		addMessage,
		removeLastMessage,
		onStep,
	} );

	const { stepProps: metaStep }: StepHook = useMetaDescriptionStep( {
		addMessage,
		removeLastMessage,
		onStep,
	} );

	const steps: Step[] = [
		keywordsStep,
		titleStep,
		metaStep,
		{
			id: 'completion',
			title: __( 'Your post is SEO-ready', 'jetpack' ),
			messages: [
				{
					content: __( "Here's your updated checklist:", 'jetpack' ),
					showIcon: true,
				},
				{
					content: createInterpolateElement(
						__( '✅ Keywords<br/>✅ Title<br/>✅ Meta description', 'jetpack' ),
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
		},
	];

	const currentStepData = steps[ currentStep ];

	useEffect( () => {
		if ( isOpen && messages.length === 0 ) {
			// Initialize with first step messages
			currentStepData.messages.forEach( message =>
				addMessage( {
					content: message.content,
					showIcon: message.showIcon,
				} )
			);
		}
	}, [ isOpen, currentStepData.messages, messages ] );

	const handleNext = () => {
		if ( currentStep < steps.length - 1 ) {
			debug( 'moving to ' + ( currentStep + 1 ), steps[ currentStep + 1 ] );
			setCurrentStep( currentStep + 1 );
			// Add next step messages
			steps[ currentStep + 1 ].messages.forEach( message =>
				addMessage( {
					content: message.content,
					showIcon: message.showIcon,
				} )
			);
			steps[ currentStep + 1 ].onStart?.();
		}
	};

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

	const handleSkip = () => {
		setIsOpen( false );
		setCurrentStep( 0 );
		setMessages( [] );
	};

	const renderCurrentInput = () => {
		if ( currentStepData.type === 'input' ) {
			return (
				<div className="seo-assistant-wizard__input">
					<TextControl
						value={ keywords }
						onChange={ setKeywords }
						placeholder={ currentStepData.placeholder }
					/>
					<Button
						variant="primary"
						className="seo-assistant-wizard__submit"
						onClick={ () => {
							currentStepData.onSubmit?.( keywords );
							handleNext();
						} }
						size="small"
					>
						↑
					</Button>
				</div>
			);
		}

		if ( currentStepData.type === 'options' ) {
			const selectedOption = currentStepData.options.find( opt => opt.selected );
			return (
				<div className="seo-assistant-wizard__actions">
					<Button variant="secondary" onClick={ currentStepData.onRetry }>
						{ currentStepData.onRetryCtaLabel }
					</Button>

					<Button
						variant="primary"
						onClick={ () => {
							currentStepData.onSubmit?.();
							handleNext();
						} }
						disabled={ ! selectedOption }
					>
						{ currentStepData.submitCtaLabel }&nbsp;
						<Icon icon={ arrowRight } size="24" />
					</Button>
				</div>
			);
		}

		if ( currentStepData.type === 'completion' ) {
			return (
				<div className="seo-assistant-wizard__completion">
					<Button variant="primary" className="seo-assistant-wizard__done" onClick={ handleDone }>
						{ __( 'Done', 'jetpack' ) }
					</Button>
				</div>
			);
		}

		return null;
	};

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
		<div>
			<p>{ __( 'Improve post engagement.', 'jetpack' ) }</p>
			{ ( isModuleActive || isLoadingModules ) && (
				<Button
					onClick={ () => setIsOpen( true ) }
					variant="secondary"
					disabled={ isLoadingModules || isOpen || ! postContent.trim?.() || disabled }
					isBusy={ isLoadingModules || isOpen }
				>
					<img src={ bigSkyIcon } alt={ __( 'SEO Assistant icon', 'jetpack' ) } />
					&nbsp;
					{ __( 'SEO Assistant', 'jetpack' ) }
				</Button>
			) }
			{ ! isModuleActive && ! isLoadingModules && (
				<SeoPlaceholder
					isLoading={ isChangingStatus }
					isModuleActive={ isModuleActive }
					changeStatus={ changeStatus }
				/>
			) }
			{ isOpen && (
				<div className="seo-assistant-wizard">
					<div className="seo-assistant-wizard__header">
						<button className="seo-assistant-wizard__back" onClick={ handleBack }>
							{ __( '←', 'jetpack' ) }
						</button>
						<h2>{ currentStepData.title }</h2>
						<button className="seo-assistant-wizard__skip" onClick={ handleSkip }>
							{ __( 'Skip', 'jetpack' ) }
						</button>
					</div>

					<div className="seo-assistant-wizard__content">
						<div className="seo-assistant-wizard__messages">
							{ renderMessages() }
							{ renderOptions() }
							<div ref={ messagesEndRef } />
						</div>

						<div className="seo-assistant-wizard__input-container">{ renderCurrentInput() }</div>
					</div>
				</div>
			) }
		</div>
	);
}
