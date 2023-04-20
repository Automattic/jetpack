/**
 * WordPress dependencies
 */
import { Button, TextControl, KeyboardShortcuts, ExternalLink } from '@wordpress/components';
import { RawHTML, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Loading from './loading';
import useSubmitQuestion from './use-submit-question';

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
export default function QuestionAnswer() {
	const {
		question,
		setQuestion,
		answer,
		isLoading,
		submitQuestion,
		references,
		waitString,
		error,
	} = useSubmitQuestion();

	const [ animationDone, setAnimationDone ] = useState( false );

	const handleSubmitQuestion = () => {
		setAnimationDone( false );
		submitQuestion();
	};

	const handleSetAnimationDone = () => {
		setAnimationDone( true );
	};

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
						{ __( 'Ask', 'jetpack' ) }
					</Button>
				</div>
			</KeyboardShortcuts>
			<div>
				<div className="jetpack-ai-chat-answer-container">
					{ error && <div className="jetpack-ai-chat-error">{ error }</div> }
					{ isLoading ? (
						<>
							<Loading />
							{ <div className="jetpack-ai-chat-wait-string">{ waitString } </div> }
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
				{ references && references.length > 0 && (
					<div className="jetpack-ai-chat-answer-references">
						<div>{ __( 'Related resources:', 'jetpack' ) }</div>

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
