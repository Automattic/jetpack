/**
 * WordPress dependencies
 */
import {
	Button,
	TextControl,
	Spinner,
	KeyboardShortcuts,
	ExternalLink,
	Icon,
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { RawHTML, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useSubmitFeedback from './use-submit-feedback';
import useSubmitQuestion from './use-submit-question';

// TODO: Configurable strings.
const waitStrings = [
	__( 'Good question, give me a moment to think about that 🤔', 'jetpack' ),
	__( 'Let me work out the answer to that, back soon!', 'jetpack' ),
	__( '🤔 Thinking, thinking, will be back with an answer soon', 'jetpack' ),
];

// This component displays the text word by word if show animation is true
function ShowLittleByLittle( { html, showAnimation, onAnimationDone } ) {
	// This is the HTML to be displayed.
	const [ displayedRawHTML, setDisplayedRawHTML ] = useState( '' );

	useEffect(
		() => {
			// That will only happen once
			if ( showAnimation && html ) {
				// This is to animate text input. I think this will give an idea of a "better" AI.
				// At this point this is an established pattern.
				const tokens = html.split( ' ' );
				for ( let i = 1; i < tokens.length; i++ ) {
					const output = tokens.slice( 0, i ).join( ' ' );
					setTimeout( () => setDisplayedRawHTML( output ), 50 * i );
				}
				setTimeout( () => {
					setDisplayedRawHTML( html );
					onAnimationDone();
				}, 50 * tokens.length );
			} else {
				setDisplayedRawHTML( html );
			}
		},
		// eslint-disable-next-line
		[]
	);

	return (
		<div className="content">
			<RawHTML>{ displayedRawHTML }</RawHTML>
		</div>
	);
}

/**
 * Primary question-answer.
 *
 * TODOs:
 * - Configurable strings.
 * - Copy response button.
 * - Submit feedback.
 * - Handle errors.
 *
 * @returns {QuestionAnswer} component.
 */
export default function QuestionAnswer() {
	const { question, setQuestion, answer, isLoading, submitQuestion, references, cacheKey } =
		useSubmitQuestion();

	const { isSubmittingFeedback, submitFeedback } = useSubmitFeedback();
	const [ feedback, setFeedback ] = useState( { rank: null, comment: null } );

	const [ animationDone, setAnimationDone ] = useState( false );
	const [ showReferences, setShowReferences ] = useState( false );
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyRef = useCopyToClipboard( answer, () => {
		setHasCopied( true );

		setTimeout( () => {
			setHasCopied( false );
		}, 3000 );
	} );

	const handleSubmitQuestion = () => {
		setAnimationDone( false );
		setShowReferences( false );
		submitQuestion();
	};

	const handleSetAnimationDone = () => {
		setAnimationDone( true );
		setShowReferences( true );
	};

	const handleRankSubmit = rankValue => {
		const updatedFeedback = { ...feedback, rank: rankValue };
		setFeedback( updatedFeedback );
		submitFeedback( updatedFeedback, cacheKey );
	};

	const showCopyButton = animationDone && ! isLoading;
	const showFeedback = animationDone && ! isLoading;
	return (
		<>
			<KeyboardShortcuts
				shortcuts={ {
					enter: handleSubmitQuestion,
				} }
			>
				<div className="jetpack-ai-chat-question-wrapper">
					<TextControl
						className="jetpack-ai-chat-question-input"
						// TODO: Configurable placeholder.
						placeholder={ __( "Enter a question about this blog's content", 'jetpack' ) }
						size={ 50 }
						value={ question }
						onChange={ newQuestion => setQuestion( newQuestion ) }
					/>

					<Button variant="primary" disabled={ isLoading } onClick={ handleSubmitQuestion }>
						{
							// TODO: Configurable button text.
							__( 'Ask', 'jetpack' )
						}
					</Button>
				</div>
			</KeyboardShortcuts>
			<div>
				<div className="jetpack-ai-chat-answer-container">
					{ isLoading ? (
						<>
							<Spinner />
							{ waitStrings[ Math.floor( Math.random() * 3 ) ] }
						</>
					) : (
						// eslint-disable-next-line react/no-danger
						<ShowLittleByLittle
							showAnimation={ ! animationDone }
							onAnimationDone={ handleSetAnimationDone }
							html={ answer }
						/>
					) }
				</div>
				{ showCopyButton && (
					<Button
						className="copy-button"
						disabled={ hasCopied }
						label={ __( 'Copy Response', 'jetpack' ) }
						ref={ copyRef }
					>
						<Icon icon="clipboard" />
					</Button>
				) }
				{ hasCopied && __( 'Copied!', 'jetpack' ) }
				{ showFeedback && (
					<div className="jetpack-ai-chat-answer-feedback">
						<div className="jetpack-ai-chat-answer-feedback-buttons">
							{ __( 'Was this helpful?', 'jetpack' ) }
							<Button
								className="thumbs-up"
								disabled={ isSubmittingFeedback }
								label={ __( 'Thumbs up', 'jetpack' ) }
								onClick={ () => handleRankSubmit( 'thumbs-up' ) }
							>
								<Icon icon="thumbs-up" />
							</Button>
							<Button
								className="thumbs-down"
								disabled={ isSubmittingFeedback }
								label={ __( 'Thumbs down', 'jetpack' ) }
								onClick={ () => handleRankSubmit( 'thumbs-down' ) }
							>
								<Icon icon="thumbs-down" />
							</Button>
						</div>
					</div>
				) }
				{ references && references.length > 0 && showReferences && (
					<div className="jetpack-ai-chat-answer-references">
						<div>
							{
								// TODO: Configurable text.
								__( 'Additional resources:', 'jetpack' )
							}
						</div>

						<ul>
							{ references.map( ( reference, index ) => (
								<li key={ index }>
									<ExternalLink href={ reference.url }>{ reference.title }</ExternalLink>
								</li>
							) ) }
						</ul>
					</div>
				) }
			</div>
		</>
	);
}
