import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';
import QuestionAnswer from './question-answer';
import './view.scss';

const AskWP = ( { askButtonLabel } ) => {
	return (
		<div>
			<QuestionAnswer askButtonLabel={ askButtonLabel } />
		</div>
	);
};

domReady( function () {
	const container = document.querySelector( '#jetpack-ai-chat' );
	const askButtonLabel = container.getAttribute( 'data-ask-button-label' );
	render( <AskWP askButtonLabel={ askButtonLabel } />, container );
} );
