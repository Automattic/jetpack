import { Button, TextControl } from '@wordpress/components';
import {
	useState,
	useCallback,
	useEffect,
	useRef,
	createInterpolateElement,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import debugFactory from 'debug';
import './style.scss';

type StepType = 'input' | 'options' | 'completion';

interface Message {
	id: string;
	content: string | React.ReactNode;
	isUser?: boolean;
}

interface Option {
	id: string;
	content: string;
	selected?: boolean;
}

interface BaseStep {
	id: string;
	title: string;
	messages: string[] | React.ReactNode[];
	type: StepType;
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
	onRegenerate?: () => void;
}

interface CompletionStep extends BaseStep {
	type: 'completion';
}

type Step = InputStep | OptionsStep | CompletionStep;

interface SeoAssistantProps {
	busy?: boolean;
	disabled?: boolean;
	onStep?: ( data: { value: string | Option | null } ) => void;
}

const debug = debugFactory( 'jetpack-ai:seo-assistant' );

export default function SeoAssistant( { busy, disabled, onStep }: SeoAssistantProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ currentStep, setCurrentStep ] = useState( 0 );
	const [ keywords, setKeywords ] = useState( '' );
	const [ selectedTitle, setSelectedTitle ] = useState< string >();
	const [ selectedMetaDescription, setSelectedMetaDescription ] = useState< string >();
	const [ messages, setMessages ] = useState< Message[] >( [] );
	const messagesEndRef = useRef< HTMLDivElement >( null );
	const [ titleOptions, setTitleOptions ] = useState< Option[] >( [
		{
			id: '1',
			content: 'A Photo Gallery for Gardening Enthusiasths: Flora Guide',
		},
		{
			id: '2',
			content: 'Flora Guide: Beautiful Photos of Flowers and Plants for Gardening Enthusiasts',
		},
	] );

	const [ metaDescriptionOptions, setMetaDescriptionOptions ] = useState< Option[] >( [
		{
			id: 'meta-1',
			content:
				'Explore breathtaking flower and plant photography in our Flora Guide, featuring tips and inspiration for gardening and plant enthusiasts to enhance their outdoor spaces.',
		},
	] );

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};

	useEffect( () => {
		scrollToBottom();
	}, [ messages ] );

	const addMessage = ( content: string | React.ReactNode, isUser = false ) => {
		setMessages( prev => [
			...prev,
			{
				id: `message-${ prev.length }`,
				content,
				isUser,
			},
		] );
	};

	const handleKeywordsSubmit = useCallback(
		( value: string ) => {
			setKeywords( value );
			addMessage( value, true );
			const keywordlist = value
				.split( ',' )
				.map( k => k.trim() )
				.reduce( ( acc, curr, i, arr ) => {
					if ( i === arr.length - 1 ) {
						return `${ acc } & ${ curr }`;
					}
					return i === 0 ? curr : `${ acc }, ${ curr }`;
				}, '' );
			const message = createInterpolateElement(
				/* Translators: wrapped string is list of keywords user has entered */
				sprintf( __( `Got it! You're targeting <b>%s</b>. ✨✅`, 'jetpack' ), keywordlist ),
				{
					b: <b />,
				}
			);
			addMessage( message );
			if ( onStep ) {
				onStep( { value: value } );
			}
		},
		[ onStep ]
	);

	const handleTitleSelect = useCallback( ( option: Option ) => {
		setSelectedTitle( option.content );
		setTitleOptions( prev =>
			prev.map( opt => ( {
				...opt,
				selected: opt.id === option.id,
			} ) )
		);
	}, [] );

	const handleTitleRegenerate = useCallback( () => {
		// This would typically be an async call to generate new titles
		debug( 'Regenerating titles...' );
	}, [] );

	const handleTitleSubmit = useCallback( () => {
		addMessage( selectedTitle, true );
		addMessage( __( 'Title updated! ✅', 'jetpack' ) );
		if ( onStep ) {
			onStep( { value: selectedTitle } );
		}
	}, [ selectedTitle, onStep ] );

	const handleMetaDescriptionSelect = useCallback( ( option: Option ) => {
		setSelectedMetaDescription( option.content );
		setMetaDescriptionOptions( prev =>
			prev.map( opt => ( {
				...opt,
				selected: opt.id === option.id,
			} ) )
		);
	}, [] );

	const handleMetaDescriptionSubmit = useCallback( () => {
		addMessage( selectedMetaDescription, true );
		addMessage( __( 'Meta description updated! ✅', 'jetpack' ) );
		if ( onStep ) {
			onStep( { value: selectedMetaDescription } );
		}
	}, [ selectedMetaDescription, onStep ] );

	const handleDone = useCallback( () => {
		setIsOpen( false );
		setCurrentStep( 0 );
		setMessages( [] );
	}, [] );

	const steps: Step[] = [
		{
			id: 'keywords',
			title: __( 'Optimise for SEO', 'jetpack' ),
			messages: [
				__( "Hi there! 👋 Let's optimise your blog post for SEO.", 'jetpack' ),
				createInterpolateElement(
					__(
						"Here's what we can improve:<br>1. Keywords<br>2. Title<br>3. Meta description",
						'jetpack'
					),
					{ br: <br /> }
				),
				__( 'To start, please enter 1–3 focus keywords that describe your blog post.', 'jetpack' ),
			],
			type: 'input',
			placeholder: __( 'Photography, plants', 'jetpack' ),
			onSubmit: handleKeywordsSubmit,
		},
		{
			id: 'title',
			title: __( 'Optimise Title', 'jetpack' ),
			messages: [
				__(
					"Let's optimise your title. Here are two suggestions based on your keywords. Select the one you prefer:",
					'jetpack'
				),
			],
			type: 'options',
			options: titleOptions,
			onSelect: handleTitleSelect,
			onSubmit: handleTitleSubmit,
			onRegenerate: handleTitleRegenerate,
		},
		{
			id: 'meta',
			title: __( 'Add meta description', 'jetpack' ),
			messages: [
				__( "Now, let's optimize your meta description. Here's a suggestion:", 'jetpack' ),
			],
			type: 'options',
			options: metaDescriptionOptions,
			onSelect: handleMetaDescriptionSelect,
			onSubmit: handleMetaDescriptionSubmit,
			onRegenerate: handleTitleRegenerate, // Reuse the same handler for now
		},
		{
			id: 'completion',
			title: __( 'Your post is SEO-ready', 'jetpack' ),
			messages: [
				__( "Here's your updated checklist:", 'jetpack' ),
				createInterpolateElement(
					__( '✅ Keywords<br>✅ Title<br>✅ Meta description', 'jetpack' ),
					{ br: <br /> }
				),
				createInterpolateElement(
					__(
						'SEO optimization complete! 🎉<br>Your blog post is now search-engine friendly.<br>nHappy blogging! 😊',
						'jetpack'
					),
					{ br: <br /> }
				),
			],
			type: 'completion',
		},
	];

	const currentStepData = steps[ currentStep ];

	useEffect( () => {
		if ( isOpen && messages.length === 0 ) {
			// Initialize with first step messages
			currentStepData.messages.forEach( message => addMessage( message ) );
		}
	}, [ isOpen, currentStepData.messages, messages ] );

	const handleNext = () => {
		if ( currentStep < steps.length - 1 ) {
			debug( 'moving to ' + ( currentStep + 1 ), steps[ currentStep + 1 ] );
			setCurrentStep( currentStep + 1 );
			// Add next step messages
			steps[ currentStep + 1 ].messages.forEach( message => addMessage( message ) );
		}
	};

	const handleBack = () => {
		if ( currentStep > 0 ) {
			setCurrentStep( currentStep - 1 );
			// Re-add previous step messages
			steps[ currentStep - 1 ].messages.forEach( message => addMessage( message ) );
		}
	};

	const handleSkip = () => {
		setIsOpen( false );
		setCurrentStep( 0 );
		setMessages( [] );
	};

	if ( ! isOpen ) {
		return (
			<div>
				<p>{ __( 'Improve post engagement.', 'jetpack' ) }</p>
				<Button
					onClick={ () => setIsOpen( true ) }
					variant="secondary"
					disabled={ disabled }
					isBusy={ busy }
				>
					{ __( 'SEO Assistant', 'jetpack' ) }
				</Button>
			</div>
		);
	}

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
					>
						{ __( '↑', 'jetpack' ) }
					</Button>
				</div>
			);
		}

		if ( currentStepData.type === 'options' ) {
			const selectedOption = currentStepData.options.find( opt => opt.selected );

			return (
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
					<div className="seo-assistant-wizard__actions">
						<Button variant="secondary" onClick={ currentStepData.onRegenerate }>
							{ __( 'Regenerate', 'jetpack' ) }
						</Button>
						{ selectedOption && (
							<Button
								variant="primary"
								onClick={ () => {
									currentStepData.onSubmit?.();
									handleNext();
								} }
							>
								{ __( 'Insert →', 'jetpack' ) }
							</Button>
						) }
					</div>
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

	return (
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
					{ messages.map( message => (
						<div
							key={ message.id }
							className={ clsx( 'seo-assistant-wizard__message', {
								'is-user': message.isUser,
							} ) }
						>
							{ message.content }
						</div>
					) ) }
					<div ref={ messagesEndRef } />
				</div>

				<div className="seo-assistant-wizard__input-container">{ renderCurrentInput() }</div>
			</div>
		</div>
	);
}
