import { registerCoreBlocks } from '@wordpress/block-library';
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import Editor from './editor';

import './styles.scss';

domReady( function () {
	const settings = window.getJetpackFormsSettings || {};
	registerCoreBlocks();
	const root = createRoot( document.getElementById( 'jetpack-form-editor' ) );
	root.render( <Editor settings={ settings } /> );
} );
