import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';
import QuestionAnswer from './question-answer';
import './view.scss';

const AiChat = ( {
	askButtonLabel,
	blogId,
	blogType,
	placeholder,
	showCopy,
	showFeedback,
	showSources,
} ) => {
	return (
		<div>
			<QuestionAnswer
				askButtonLabel={ askButtonLabel }
				blogId={ blogId }
				blogType={ blogType }
				placeholder={ placeholder }
				settingShowCopy={ showCopy }
				settingShowFeedback={ showFeedback }
				settingShowSources={ showSources }
			/>
		</div>
	);
};

domReady( function () {
	const container = document.querySelector( '#jetpack-ai-chat' );
	const askButtonLabel = container.getAttribute( 'data-ask-button-label' );
	const placeholder = container.getAttribute( 'data-placeholder' );
	const blogId = container.getAttribute( 'data-blog-id' );
	const blogType = container.getAttribute( 'data-blog-type' );
	render(
		<AiChat
			askButtonLabel={ askButtonLabel }
			blogId={ blogId }
			blogType={ blogType }
			placeholder={ placeholder }
			showCopy={ !! parseInt( container.getAttribute( 'data-show-copy' ) ) }
			showFeedback={ !! parseInt( container.getAttribute( 'data-show-feedback' ) ) }
			showSources={ !! parseInt( container.getAttribute( 'data-show-sources' ) ) }
		/>,
		container
	);
} );
