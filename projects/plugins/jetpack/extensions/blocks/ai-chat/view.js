import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';
import QuestionAnswer from './question-answer';
import './view.scss';

const AskWP = () => {
	return (
		<div>
			<QuestionAnswer />
		</div>
	);
};

domReady( function () {
	const container = document.querySelector( '#jetpack-ai-chat' );
	render( <AskWP />, container );
} );
