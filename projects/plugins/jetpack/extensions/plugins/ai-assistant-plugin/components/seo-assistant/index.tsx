import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { Button, TextControl, SVG, Circle, Icon } from '@wordpress/components';
import {
	useState,
	useCallback,
	useEffect,
	useRef,
	createInterpolateElement,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { arrowRight } from '@wordpress/icons';
import clsx from 'clsx';
import debugFactory from 'debug';
import { SeoPlaceholder } from '../../../../plugins/seo/components/placeholder';
import usePostContent from '../../hooks/use-post-content';
import './style.scss';
import bigSkyIcon from './big-sky-icon.svg';

type StepType = 'input' | 'options' | 'completion';

interface Message {
	id: string;
	content: string | React.ReactNode;
	isUser?: boolean;
	showIcon?: boolean;
}

interface Option {
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

type Step = InputStep | OptionsStep | CompletionStep;

interface SeoAssistantProps {
	busy?: boolean;
	disabled?: boolean;
	onStep?: ( data: { value: string | Option | null } ) => void;
}

const debug = debugFactory( 'jetpack-ai:seo-assistant' );

const TypingMessage = () => {
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
	const [ keywords, setKeywords ] = useState( '' );
	const [ selectedTitle, setSelectedTitle ] = useState< string >();
	const [ selectedMetaDescription, setSelectedMetaDescription ] = useState< string >();
	const [ messages, setMessages ] = useState< Message[] >( [] );
	const messagesEndRef = useRef< HTMLDivElement >( null );
	const [ titleOptions, setTitleOptions ] = useState< Option[] >( [] );
	const postContent = usePostContent();
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'seo-tools' );

	const [ metaDescriptionOptions, setMetaDescriptionOptions ] = useState< Option[] >( [] );

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};

	useEffect( () => {
		scrollToBottom();
	}, [ messages ] );

	const addMessage = ( content: string | React.ReactNode, isUser = false, showIcon = ! isUser ) => {
		setMessages( prev => [
			...prev,
			{
				id: `message-${ prev.length }`,
				content,
				isUser,
				showIcon,
			},
		] );
	};

	/* Removes last message */
	const removeLastMessage = () => {
		setMessages( prev => prev.slice( 0, -1 ) );
	};

	const handleKeywordsSubmit = useCallback(
		( value: string ) => {
			setKeywords( value );
			addMessage( value, true );
			const keywordlist = value
				.split( ',' )
				.map( k => k.trim() )
				.reduce( ( acc, curr, i, arr ) => {
					if ( arr.length === 1 ) {
						return curr;
					}
					if ( i === arr.length - 1 ) {
						return `${ acc } </b>&<b> ${ curr }`;
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

	const handleTitleGenerate = useCallback( async () => {
		let newTitles;
		// we only generate if options are empty
		if ( titleOptions.length === 0 ) {
			debug( 'Generating titles...' );
			addMessage( <TypingMessage /> );
			newTitles = await new Promise( resolve =>
				setTimeout(
					() =>
						resolve( [
							{
								id: '1',
								content: 'A Photo Gallery for Gardening Enthusiasths: Flora Guide',
							},
							{
								id: '2',
								content:
									'Flora Guide: Beautiful Photos of Flowers and Plants for Gardening Enthusiasts',
							},
						] ),
					2000
				)
			);
			removeLastMessage();
		}
		addMessage( 'Here are two suggestions based on your keywords. Select the one you prefer:' );
		setTitleOptions( newTitles || titleOptions );
	}, [ titleOptions ] );

	const handleTitleRegenerate = useCallback( async () => {
		// This would typically be an async call to generate new titles
		debug( 'Regenerating titles...' );
		setTitleOptions( [] );
		addMessage( <TypingMessage /> );
		const newTitles = await new Promise< Array< Option > >( resolve =>
			setTimeout(
				() =>
					resolve( [
						{
							id: '1',
							content: 'A Photo Gallery for Gardening Enthusiasths: Flora Guide',
						},
						{
							id: '2',
							content:
								'Flora Guide: Beautiful Photos of Flowers and Plants for Gardening Enthusiasts',
						},
					] ),
				2000
			)
		);
		removeLastMessage();
		addMessage( 'Here are two new suggestions based on your keywords. Select the one you prefer:' );
		setTitleOptions( newTitles );
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

	const handleMetaDescriptionGenerate = useCallback( async () => {
		let newMetaDescriptions;
		// we only generate if options are empty
		if ( metaDescriptionOptions.length === 0 ) {
			debug( 'Generating titles...' );
			addMessage( <TypingMessage /> );
			newMetaDescriptions = await new Promise( resolve =>
				setTimeout(
					() =>
						resolve( [
							{
								id: 'meta-1',
								content:
									'Explore breathtaking flower and plant photography in our Flora Guide, featuring tips and inspiration for gardening and plant enthusiasts to enhance their outdoor spaces.',
							},
						] ),
					2000
				)
			);
			removeLastMessage();
		}
		addMessage( "Here's a suggestion:" );
		setMetaDescriptionOptions( newMetaDescriptions || metaDescriptionOptions );
	}, [ metaDescriptionOptions ] );

	const handleMetaDescriptionRegenerate = useCallback( async () => {
		debug( 'Generating new meta description...' );
		setMetaDescriptionOptions( [] );
		addMessage( <TypingMessage /> );
		const newMetaDescription = await new Promise< Array< Option > >( resolve =>
			setTimeout(
				() =>
					resolve( [
						{
							id: 'meta-1',
							content:
								'Explore breathtaking flower and plant photography in our Flora Guide, featuring tips and inspiration for gardening and plant enthusiasts to enhance their outdoor spaces.',
						},
					] ),
				2000
			)
		);
		removeLastMessage();
		addMessage( "Here's a new suggestion:" );
		setMetaDescriptionOptions( newMetaDescription );
	}, [] );

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
				{
					content: createInterpolateElement(
						__( "<b>Hi there! 👋 Let's optimise your blog post for SEO.</b>", 'jetpack' ),
						{ b: <b /> }
					),
					showIcon: true,
				},
				{
					content: createInterpolateElement(
						__(
							"Here's what we can improve:<br />1. Keywords<br />2. Title<br />3. Meta description",
							'jetpack'
						),
						{ br: <br /> }
					),
					showIcon: false,
				},
				{
					content: __(
						'To start, please enter 1–3 focus keywords that describe your blog post.',
						'jetpack'
					),
					showIcon: true,
				},
			],
			type: 'input',
			placeholder: __( 'Photography, plants', 'jetpack' ),
			onSubmit: handleKeywordsSubmit,
		},
		{
			id: 'title',
			title: __( 'Optimise Title', 'jetpack' ),
			messages: [
				{
					content: __( "Let's optimise your title.", 'jetpack' ),
					showIcon: true,
				},
			],
			type: 'options',
			options: titleOptions,
			onSelect: handleTitleSelect,
			onSubmit: handleTitleSubmit,
			submitCtaLabel: __( 'Insert', 'jetpack' ),
			onRetry: handleTitleRegenerate,
			onRetryCtaLabel: __( 'Regenerate', 'jetpack' ),
			onStart: handleTitleGenerate,
		},
		{
			id: 'meta',
			title: __( 'Add meta description', 'jetpack' ),
			messages: [
				{
					content: __( "Now, let's optimize your meta description.", 'jetpack' ),
					showIcon: true,
				},
			],
			type: 'options',
			options: metaDescriptionOptions,
			onSelect: handleMetaDescriptionSelect,
			onSubmit: handleMetaDescriptionSubmit,
			submitCtaLabel: __( 'Insert', 'jetpack' ),
			onRetry: handleMetaDescriptionRegenerate,
			onRetryCtaLabel: __( 'Regenerate', 'jetpack' ),
			onStart: handleMetaDescriptionGenerate,
		},
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
				addMessage( message.content, false, message.showIcon )
			);
		}
	}, [ isOpen, currentStepData.messages, messages ] );

	const handleNext = () => {
		if ( currentStep < steps.length - 1 ) {
			debug( 'moving to ' + ( currentStep + 1 ), steps[ currentStep + 1 ] );
			setCurrentStep( currentStep + 1 );
			// Add next step messages
			steps[ currentStep + 1 ].messages.forEach( message =>
				addMessage( message.content, false, message.showIcon )
			);
			steps[ currentStep + 1 ].onStart?.();
		}
	};

	const handleBack = () => {
		if ( currentStep > 0 ) {
			setCurrentStep( currentStep - 1 );
			// Re-add previous step messages
			steps[ currentStep - 1 ].messages.forEach( message =>
				addMessage( message.content, false, message.showIcon )
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
						<Icon icon={ arrowRight } size="small" />
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
				<div className="seo-assistant-wizard__message-text">{ message.content }</div>
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
