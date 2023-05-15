import { RawHTML, useState, useEffect } from '@wordpress/element';
import MarkdownIt from 'markdown-it';

const markdownConverter = new MarkdownIt( {
	breaks: true,
} );

// TODO: Switch the API to use streaming in which case this won't be needed.
// This component displays the text word by word if show animation is true
const ShowLittleByLittle = ( { markdown, showAnimation, onAnimationDone } ) => {
	// This is the HTML to be displayed.
	const [ displayedRawHTML, setDisplayedRawHTML ] = useState( '' );

	useEffect(
		() => {
			// That will only happen once
			if ( showAnimation ) {
				// This is to animate text input. I think this will give an idea of a "better" AI.
				// At this point this is an established pattern.
				const tokens = markdown.split( ' ' );
				for ( let i = 1; i < tokens.length; i++ ) {
					const output = tokens.slice( 0, i ).join( ' ' );
					setTimeout( () => setDisplayedRawHTML( markdownConverter.render( output ), 50 * i ) );
				}
				setTimeout( () => {
					setDisplayedRawHTML( markdownConverter.render( markdown ) );
					onAnimationDone();
				}, 50 * tokens.length );
			} else {
				setDisplayedRawHTML( markdownConverter.render( markdown ) );
			}
		},
		// eslint-disable-next-line
		[]
	);
	return (
		<div className="jetpack-ai-assistant__content">
			<RawHTML>{ displayedRawHTML }</RawHTML>
		</div>
	);
};

export default ShowLittleByLittle;
