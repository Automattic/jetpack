/*
 * NL-840 proof of concept: `@woocommerce/email-editor` is resolved by a webpack
 * alias to a local WooCommerce checkout until the styles panel export is
 * released, so eslint's resolver cannot see it.
 */
/* eslint-disable import/no-unresolved */
import {
	createStore,
	storeName,
	StylesPanel,
	useCanEditEmailStyles,
} from '@woocommerce/email-editor';
import { PanelBody } from '@wordpress/components';
import { dispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import NewsletterSidebarFill from '../../blocks/subscriptions/newsletter-sidebar-slot';

// The panel reuses core's block-editor and edit-site class names, but these are
// the rules that lay it out. Without them the navigator screens have no height.
import '@woocommerce/email-editor/build-style/style.css';
/* eslint-enable import/no-unresolved */

/**
 * Proof of concept for NL-840 — mount the WooCommerce email editor's global
 * styles UI in the Jetpack newsletter sidebar, outside the email editor.
 *
 * The panel reads and writes through the `email-editor/editor` store rather
 * than props, so the store has to be registered and configured before anything
 * renders. `globalStylesPostId` in the config is what points it at
 * `wp-global-styles-woocommerce-email` instead of the site's own global styles.
 */
const config = window.JetpackNewsletterStyles;

if ( config ) {
	createStore();
	dispatch( storeName ).setEditorConfig( config );
}

const NewsletterStylesFill = () => {
	const canEdit = useCanEditEmailStyles();

	if ( ! canEdit ) {
		return null;
	}

	return (
		<NewsletterSidebarFill>
			<PanelBody title={ __( 'Email styles', 'jetpack' ) } initialOpen={ true }>
				<StylesPanel />
			</PanelBody>
		</NewsletterSidebarFill>
	);
};

const NewsletterStyles = () => {
	const postType = useSelect( select => select( 'core/editor' )?.getCurrentPostType(), [] );

	// Newsletters are ordinary posts. Everything else in the post editor is out
	// of scope for the spike.
	if ( ! config || postType !== 'post' ) {
		return null;
	}

	return <NewsletterStylesFill />;
};

export default NewsletterStyles;
