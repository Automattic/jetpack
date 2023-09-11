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
import CopyButton from './components/copyButton';
import DisplayError from './components/displayError';
import Feedback from './components/feedback';
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
 * @param {object} props - Component props.
 * @param {string} props.askButtonLabel - Ask button label.
 * @param {number} props.blogId - Blog ID.
 * @param {string} props.blogType - Blog type (wpcom|jetpack) for wpcom simple and jetpack/atomic.
 * @returns {QuestionAnswer} component.
 */
export default function QuestionAnswer( { askButtonLabel, blogId, blogType } ) {
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

	const [ animationDone, setAnimationDone ] = useState( false );
	const [ showReferences, setShowReferences ] = useState( false );

	const handleSubmitQuestion = () => {
		setAskError( false );
		setAnimationDone( false );
		setShowReferences( false );
		submitQuestion();
	};

	const handleSetAnimationDone = () => {
		setAnimationDone( true );
		setShowReferences( true );
	};

	const showCopyButton = animationDone && ! isLoading && answer;
	const showFeedback = animationDone && ! isLoading && cacheKey;
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
						placeholder={ __( "Enter a question about this blog's content", 'jetpack' ) }
						size={ 50 }
						value={ question }
						onChange={ newQuestion => setQuestion( newQuestion ) }
					/>

					<Button variant="primary" disabled={ isLoading } onClick={ handleSubmitQuestion }>
						{ askButtonLabel }
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
				{ askError && <DisplayError error={ askError } /> }
				{ showCopyButton && <CopyButton answer={ answer } /> }
				{ showFeedback && (
					<Feedback blogId={ blogId } blogType={ blogType } cacheKey={ cacheKey } />
				) }
				{ references && references.length > 0 && showReferences && (
					<div className="jetpack-ai-chat-answer-references">
						<div>{ __( 'Additional resources:', 'jetpack' ) }</div>

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
