/**
 * WordPress dependencies
 */
import {
	Button,
	TextControl,
	Spinner,
	KeyboardShortcuts,
	ExternalLink,
} from '@wordpress/components';
import { RawHTML, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import CopyButton from './components/copy-button';
import DisplayError from './components/display-error';
import Feedback from './components/feedback';
import { DEFAULT_ASK_BUTTON_LABEL, DEFAULT_PLACEHOLDER } from './constants';
import useSubmitQuestion from './use-submit-question';

// TODO: Configurable strings.
const waitStrings = [
	__( 'Good question, give me a moment to think about that 🤔', 'jetpack' ),
	__( 'Let me work out the answer to that, back soon!', 'jetpack' ),
	__( '🤔 Thinking, thinking, will be back with an answer soon', 'jetpack' ),
];

// Animates responses word-by-word using stripped text, then shows full HTML.
// This avoids invalid HTML fragments that break React's DOM reconciliation.
function ShowLittleByLittle( { html, showAnimation, onAnimationDone } ) {
	const [ displayedContent, setDisplayedContent ] = useState( '' );

	useEffect(
		() => {
			if ( showAnimation && html ) {
				// Strip HTML tags to get plain text for animation
				const plainText = html.replace( /<[^>]+>/g, '' ).trim();
				const tokens = plainText.split( ' ' );

				for ( let i = 1; i < tokens.length; i++ ) {
					const output = tokens.slice( 0, i ).join( ' ' );
					setTimeout( () => setDisplayedContent( output ), 50 * i );
				}
				setTimeout( () => {
					setDisplayedContent( html );
					onAnimationDone();
				}, 50 * tokens.length );
			} else {
				setDisplayedContent( html || '' );
				onAnimationDone();
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	return (
		<div className="content">
			<RawHTML>{ displayedContent }</RawHTML>
		</div>
	);
}

/**
 * Primary question-answer.
 *
 * @param {object}  props                     - Component props.
 * @param {string}  props.askButtonLabel      - Ask button label.
 * @param {number}  props.blogId              - Blog ID.
 * @param {string}  props.blogType            - Blog type (wpcom|jetpack) for wpcom simple and jetpack/atomic.
 * @param {string}  props.placeholder         - Input placeholder.
 * @param {boolean} props.settingShowCopy     - Show copy button.
 * @param {boolean} props.settingShowFeedback - Show feedback (thumbs up/down) buttons.
 * @param {boolean} props.settingShowSources  - Show references (the list of URLs).
 * @return {QuestionAnswer} component.
 */
export default function QuestionAnswer( {
	askButtonLabel = DEFAULT_ASK_BUTTON_LABEL,
	blogId,
	blogType,
	placeholder = DEFAULT_PLACEHOLDER,
	settingShowCopy,
	settingShowFeedback,
	settingShowSources,
} ) {
	const {
		question,
		setQuestion,
		answer,
		isLoading,
		submitQuestion,
		references,
		askError,
		setAskError,
		cacheKey,
	} = useSubmitQuestion( blogType, blogId );

	const [ animationDone, setAnimationDone ] = useState( true );
	const [ showReferences, setShowReferences ] = useState( false );
	const [ feedbackSubmitted, setFeedbackSubmitted ] = useState( [] );
	const [ submittedQuestion, setSubmittedQuestion ] = useState( '' );

	const addFeedbackToState = submittedCacheKey => {
		setFeedbackSubmitted( [ ...feedbackSubmitted, submittedCacheKey ] );
	};

	const handleSubmitQuestion = () => {
		setAskError( false );
		setAnimationDone( false );
		setShowReferences( false );
		setFeedbackSubmitted( [] );
		setSubmittedQuestion( question );
		submitQuestion();
	};

	const handleSetAnimationDone = () => {
		setAnimationDone( true );
		setShowReferences( true );
	};

	const showCopyButton = settingShowCopy && animationDone && ! isLoading && answer;
	const showFeedback = settingShowFeedback && animationDone && ! isLoading && cacheKey;
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
						placeholder={ placeholder }
						size={ 50 }
						disabled={ ! animationDone || isLoading }
						value={ question }
						onChange={ newQuestion => setQuestion( newQuestion ) }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>

					<Button
						className="wp-block-button__link jetpack-ai-chat-question-button"
						disabled={ ! animationDone || isLoading }
						onClick={ handleSubmitQuestion }
					>
						{ isLoading && <Spinner /> }
						{ ! isLoading && askButtonLabel }
					</Button>
				</div>
			</KeyboardShortcuts>
			<div>
				<div className="jetpack-ai-chat-answer-container">
					{ submittedQuestion && <h2>{ submittedQuestion }</h2> }
					{ isLoading && <span>{ waitStrings[ Math.floor( Math.random() * 3 ) ] }</span> }
					{ ! isLoading && (
						<ShowLittleByLittle
							showAnimation={ ! animationDone }
							onAnimationDone={ handleSetAnimationDone }
							html={ answer }
						/>
					) }
				</div>
				{ askError && ! isLoading && <DisplayError error={ askError } /> }
				{ showCopyButton && <CopyButton answer={ answer } /> }
				{ settingShowSources && references && references.length > 0 && showReferences && (
					<div className="jetpack-ai-chat-answer-references">
						<h3>{ __( 'Additional resources:', 'jetpack' ) }</h3>

						<ul>
							{ references.map( ( reference, index ) => (
								<li key={ index }>
									<ExternalLink href={ reference.url }>{ reference.title }</ExternalLink>
								</li>
							) ) }
						</ul>
						<hr />
					</div>
				) }
				{ showFeedback && (
					<Feedback
						blogId={ blogId }
						blogType={ blogType }
						cacheKey={ cacheKey }
						feedbackSubmitted={ feedbackSubmitted }
						addFeedback={ addFeedbackToState }
					/>
				) }
			</div>
		</>
	);
}
