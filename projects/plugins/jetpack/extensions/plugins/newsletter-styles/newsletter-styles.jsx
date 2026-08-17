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
	StylesSidebar,
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

/**
 * Which placement to demo.
 *
 * `panel` (default) renders the chrome-free StylesPanel inside the existing
 * Jetpack Newsletter sidebar — the placement we would ship.
 *
 * `sidebar` renders the unmodified StylesSidebar, which registers its own
 * complementary area. That is the zero-glue case: if it works untouched in the
 * post editor, "does the panel run outside the email editor shell" is settled
 * without any of our wiring to argue about.
 *
 * Switch with ?jetpack_styles_placement=sidebar on the editor URL.
 *
 * @return {'panel'|'sidebar'} The placement to render.
 */
function getPlacement() {
	const placement = new URLSearchParams( window.location.search ).get( 'jetpack_styles_placement' );
	return placement === 'sidebar' ? 'sidebar' : 'panel';
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

/**
 * Whether we are in the site editor rather than the post editor.
 *
 * The newsletter sidebar is a post-editor thing, so there is nothing to fill
 * into here — the panel has to bring its own complementary area.
 *
 * @return {boolean} True in the site editor.
 */
function isSiteEditor() {
	return window.location.pathname.endsWith( '/site-editor.php' );
}

const NewsletterStyles = () => {
	const postType = useSelect( select => select( 'core/editor' )?.getCurrentPostType(), [] );

	if ( ! config ) {
		return null;
	}

	if ( isSiteEditor() ) {
		return <StylesSidebar />;
	}

	// Newsletters are ordinary posts. Everything else in the post editor is out
	// of scope for the spike.
	if ( postType !== 'post' ) {
		return null;
	}

	return getPlacement() === 'sidebar' ? <StylesSidebar /> : <NewsletterStylesFill />;
};

export default NewsletterStyles;
