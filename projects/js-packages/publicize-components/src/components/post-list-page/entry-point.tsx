import { ThemeProvider } from '@automattic/jetpack-components';
import * as WPElement from '@wordpress/element';
import $ from 'jquery';
import { App } from './app';
import type ReactDOM from 'react-dom/client';

const ROOT_ID = 'jetpack-social-share-post-root';

const root = document.getElementById( ROOT_ID );

let createdRoot: ReactDOM.Root | null = null;

const unmountApp = () => {
	createdRoot?.unmount();
	createdRoot = null;
};

const renderApp = ( postId: number ) => {
	if ( root ) {
		createdRoot = createdRoot || WPElement.createRoot( root );

		createdRoot.render(
			<ThemeProvider targetDom={ document.body }>
				<App onClose={ unmountApp } postId={ postId } />
			</ThemeProvider>
		);
	} else {
		// eslint-disable-next-line no-console
		console.error( `Root element not found: ${ ROOT_ID }` );
	}
};

// register event handlers on document ready
$( () => {
	$( 'a.jetpack-social-share-post-action' ).on( 'click', e => {
		e.preventDefault();

		const postId = Number( e.target.dataset.postid );

		if ( postId ) {
			renderApp( postId );
		}
	} );
} );
