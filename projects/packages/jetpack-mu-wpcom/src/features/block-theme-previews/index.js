import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';
import BlockThemePreviewsModal from './modal';
import './store';

domReady( () => {
	registerPlugin( 'wpcom-block-theme-previews', {
		render: BlockThemePreviewsModal,
	} );
} );
