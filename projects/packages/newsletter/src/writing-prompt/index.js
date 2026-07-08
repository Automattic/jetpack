import { createRoot } from '@wordpress/element';
import WritingPrompt from './writing-prompt.js';

import './style.scss';

const container = document.getElementById( 'wpcom_daily_writing_prompt_main' );
if ( container ) {
	const root = createRoot( container );
	root.render( <WritingPrompt /> );
}
