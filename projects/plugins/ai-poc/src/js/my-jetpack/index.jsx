import { createRoot } from '@wordpress/element';
import AIBubble from './components/AIBubble';

// Wait for DOM to be ready
const initAIBubble = () => {
	// Create a container for our AI bubble
	const container = document.createElement( 'div' );
	container.id = 'jetpack-ai-poc-bubble';
	document.body.appendChild( container );

	const root = createRoot( container );
	root.render( <AIBubble /> );
};

// Initialize when DOM is ready
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initAIBubble );
} else {
	initAIBubble();
}
