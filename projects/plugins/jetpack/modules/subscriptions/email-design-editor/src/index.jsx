/**
 * Client-side entry point for the newsletter email design screen.
 *
 * The editor's bootstrap bundle lives on the WordPress.com shadow blog and is
 * fetched from the browser rather than inlined, so the screen paints without a
 * blocking proxy request on Atomic and self-hosted. It also carries records the
 * editor would otherwise fetch — see `buildPreloadMap()`.
 *
 * The page that renders the container and localises
 * `window.JetpackEmailDesignEditor` lands separately; until then nothing enqueues
 * this bundle and the mount below returns. See NL-848 and NL-851.
 */
import { ExperimentalEmailEditor } from '@woocommerce/email-editor';
import apiFetch from '@wordpress/api-fetch';
import { Notice } from '@wordpress/components';
import { createRoot, StrictMode } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

// Declared by the Jetpack plugin on every platform, answered by WordPress.com, so
// the browser calls one local URL everywhere.
const BOOTSTRAP_PATH = '/wpcom/v2/email-editor-bootstrap';

// The design is a block template. Unlike the template's id, this is the same
// everywhere, so the page does not supply it.
const TEMPLATE_POST_TYPE = 'wp_template';

// The editor assigns these straight to `window.location.href`, so `javascript:`
// and `data:` would execute rather than navigate.
const NAVIGABLE_PROTOCOLS = [ 'http:', 'https:' ];

/**
 * Check that a URL the editor will navigate to is one the browser can navigate to.
 *
 * Reads the parsed protocol rather than testing the string: relative resolution
 * does not neutralise a scheme, and the parser strips leading whitespace that a
 * `startsWith( 'javascript:' )` test would miss.
 *
 * @param {*}      value - The configured URL.
 * @param {string} key   - Its key, named in the error so the page can be fixed.
 * @throws {Error} If the value is not a URL the browser can navigate to.
 * @return {void}
 */
function assertNavigableUrl( value, key ) {
	if ( typeof value !== 'string' ) {
		throw new Error( `JetpackEmailDesignEditor.urls.${ key } must be a string.` );
	}

	let resolved;

	try {
		resolved = new URL( value, window.location.href );
	} catch {
		throw new Error( `JetpackEmailDesignEditor.urls.${ key } is not a valid URL.` );
	}

	if ( ! NAVIGABLE_PROTOCOLS.includes( resolved.protocol ) ) {
		throw new Error( `JetpackEmailDesignEditor.urls.${ key } must be an http or https URL.` );
	}
}

/**
 * Translate the page's data and the fetched bundle into the editor's configuration.
 *
 * Not a pass-through: the bundle is snake_cased (`editor_settings`, `editor_theme`)
 * while the package's store reads `editorSettings`, `theme`, `urls`, `userEmail`
 * and `globalStylesPostId`. Passing it unmapped boots the editor with no settings
 * and no theme, and reports nothing.
 *
 * `editorSettings` merges both halves — WordPress.com strips the two settings that
 * describe the installation rather than the design, and the page supplies this
 * site's own — with the page's half last so it wins.
 *
 * @param {object} bundle - The response from the bootstrap route.
 * @param {object} data   - The value of `window.JetpackEmailDesignEditor`.
 * @throws {Error} If either half left out something the editor cannot start without.
 * @return {object} The editor's `config` prop.
 */
export function buildEditorConfig( bundle, data ) {
	const { editorSettings, urls, userEmail, globalStylesPostId } = data;

	// Nothing validates these on the `config` prop path, so an omission would
	// otherwise surface as an unrelated failure deep in the editor.
	if ( ! bundle?.editor_settings ) {
		throw new Error( 'The email editor bundle is missing editor_settings.' );
	}

	if ( ! bundle?.editor_theme ) {
		throw new Error( 'The email editor bundle is missing editor_theme.' );
	}

	if ( typeof urls?.back !== 'string' || typeof urls?.listings !== 'string' ) {
		throw new Error( 'JetpackEmailDesignEditor.urls.back and .listings are required strings.' );
	}

	// These all end up assigned to `window.location.href` by the editor's header
	// buttons.
	Object.entries( urls ).forEach( ( [ key, value ] ) => assertNavigableUrl( value, key ) );

	return {
		editorSettings: { ...bundle.editor_settings, ...editorSettings },
		theme: bundle.editor_theme,
		urls,
		userEmail,

		// A gate, not a data source: null makes the package generate no canvas CSS at
		// all, while any valid id paints the whole theme. Nothing reads the record's
		// contents — the design arrives merged into `editor_theme`. Bundle first because
		// it is a WordPress.com post id; the page stays a fallback. See NL-871.
		globalStylesPostId: getGlobalStylesPostId( bundle ) ?? globalStylesPostId ?? null,
	};
}

/**
 * Everything the editor would otherwise fetch, keyed by the path it asks for.
 *
 * The canvas templates and the global-styles record are registered only while
 * WordPress.com builds the bootstrap bundle, so a request from the browser cannot
 * reach them and the editor waits forever on a record it will never get.
 *
 * Registering them for every REST request would fix that, but would also list the
 * email templates in the Site Editor — a visible regression on every enrolled blog.
 * Preloading confines them to this page.
 *
 * The records come from the bundle rather than being assembled here: the editor
 * reads fields a four-field summary cannot stand in for, including `post_types`
 * with no optional chaining.
 *
 * @param {object} bundle     - The response from the bootstrap route.
 * @param {string} templateId - The id of the template the editor opens.
 * @return {object|null} A map for `createPreloadingMiddleware`, or null when the bundle
 *                       carries nothing to preload.
 */
export function buildPreloadMap( bundle, templateId ) {
	const map = {
		...templatePreloads( bundle, templateId ),
		...globalStylesPreloads( bundle ),
	};

	return Object.keys( map ).length > 0 ? map : null;
}

/**
 * The id of the global-styles record the bundle points at, or null when it sent no usable one.
 *
 * Validated because it is interpolated into the preload's path keys, which are
 * deliberately exact — an id carrying a slash or query string would widen what we
 * answer for, and the site's own global-styles record has to keep reaching the
 * network untouched.
 *
 * @param {object} bundle - The response from the bootstrap route.
 * @return {number|null} The record's id, or null.
 */
function getGlobalStylesPostId( bundle ) {
	const id = bundle?.global_styles?.post_id;

	return Number.isInteger( id ) && id > 0 ? id : null;
}

/**
 * The global-styles record the editor reads its design from.
 *
 * The `GET` and the `OPTIONS` both matter, and both carry `Allow`: core-data derives the
 * record's permissions from either response, last one winning.
 *
 * The body has to be the record WordPress.com sent, not a placeholder — the canvas
 * takes its colours from these contents.
 *
 * `can_edit` decides whether the Styles panel exists at all. Without update permission the
 * package's sidebar returns nothing; it does not render a read-only panel.
 *
 * Only this exact id, never a pattern — the editor loads the site's own global-styles
 * record alongside ours, and that one must keep reaching the network.
 *
 * @param {object} bundle - The response from the bootstrap route.
 * @return {object} Preload entries, empty when the bundle carries no global styles.
 */
function globalStylesPreloads( bundle ) {
	const globalStyles = bundle?.global_styles;
	const id = getGlobalStylesPostId( bundle );

	if ( ! id || ! globalStyles?.record ) {
		return {};
	}

	// A preloaded GET carries permissions as well as data: core-data reads `Allow` off the record's
	// own response too, and reads a missing header as "nothing is permitted" rather than as silence.
	// The GETs resolve after the OPTIONS, so omitting it here overwrites the OPTIONS answer with a
	// flat no and the Styles panel never renders.
	const allow = globalStyles.can_edit ? 'GET, POST, PUT' : 'GET';
	const record = { body: globalStyles.record, headers: { Allow: allow } };

	return {
		[ `/wp/v2/global-styles/${ id }` ]: record,
		[ `/wp/v2/global-styles/${ id }?context=view` ]: record,
		[ `/wp/v2/global-styles/${ id }?context=edit` ]: record,

		// OPTIONS responses live under their own top-level key in the preload format.
		OPTIONS: {
			[ `/wp/v2/global-styles/${ id }` ]: { body: {}, headers: { Allow: allow } },
		},
	};
}

/**
 * The template records the editor resolves its canvas from.
 *
 * @param {object} bundle     - The response from the bootstrap route.
 * @param {string} templateId - The id of the template the editor opens.
 * @return {object} Preload entries, empty when the bundle carries no template records.
 */
function templatePreloads( bundle, templateId ) {
	const templates = bundle?.templates;

	if ( ! Array.isArray( templates ) || 0 === templates.length ) {
		return {};
	}

	// `parse: false` callers build a Response from these and read `headers`
	// unconditionally, so every entry carries one even when empty.
	const collection = {
		body: templates,
		headers: {
			'X-WP-Total': String( templates.length ),
			'X-WP-TotalPages': '1',
		},
	};

	// The context asked for varies by platform (`?context=edit` on WordPress 7.1, none
	// on WordPress.com). An unmatched key costs nothing; a miss leaves the editor
	// waiting forever.
	const map = {
		'/wp/v2/templates': collection,
		'/wp/v2/templates?context=edit': collection,
		'/wp/v2/templates?context=view': collection,
	};

	const item = templates.find( template => template?.id === templateId );

	if ( item ) {
		// Explicitly read-only, for the reason above: the header is an assertion, not decoration.
		// Nothing on this screen edits the template, and granting writes here would hand the
		// editor a template it believes it may save.
		const record = { body: item, headers: { Allow: 'GET' } };

		map[ `/wp/v2/templates/${ templateId }` ] = record;
		map[ `/wp/v2/templates/${ templateId }?context=edit` ] = record;
	}

	return map;
}

/**
 * The id of the template the editor opens.
 *
 * Read from the bundle, never derived: the package builds it from the stylesheet of
 * whichever installation registered the template, so computing it locally is right on
 * Simple and wrong on Atomic and self-hosted.
 *
 * @param {object} bundle - The response from the bootstrap route.
 * @throws {Error} If the bundle carries no template.
 * @return {string} The template's id.
 */
export function getTemplateId( bundle ) {
	const id = bundle?.template?.id;

	if ( typeof id !== 'string' || '' === id ) {
		throw new Error( 'The email editor bundle is missing its template id.' );
	}

	return id;
}

/**
 * What the screen shows when it could not load.
 *
 * The design lives on another site, so without this "nothing appeared" and "your
 * design is empty" look identical to whoever opened the page.
 *
 * @return {import('react').ReactElement} The error notice.
 */
function LoadError() {
	return (
		<Notice status="error" isDismissible={ false }>
			{ __(
				'The email design editor could not be loaded. Please reload the page to try again.',
				'jetpack'
			) }
		</Notice>
	);
}

/**
 * Fetch the bootstrap bundle and mount the editor into the page's container.
 *
 * @return {Promise<void>} Resolves once the editor or an error has rendered.
 */
export async function mountEmailDesignEditor() {
	const data = window.JetpackEmailDesignEditor;

	// Not our page — the bundle is only enqueued on the design screen.
	if ( ! data || typeof data !== 'object' ) {
		return;
	}

	const container = document.getElementById( data.elementId );

	if ( ! container ) {
		return;
	}

	const root = createRoot( container );

	try {
		const bundle = await apiFetch( {
			path: data.templateSlug
				? addQueryArgs( BOOTSTRAP_PATH, { template_slug: data.templateSlug } )
				: BOOTSTRAP_PATH,
		} );

		const config = buildEditorConfig( bundle, data );
		const postId = getTemplateId( bundle );
		const preload = buildPreloadMap( bundle, postId );

		if ( preload ) {
			// Registered last so it runs first: api-fetch applies middlewares right to
			// left, so this sees `options.path` before the rewriting middlewares. Must be
			// installed before the editor mounts, which resolves the template on first
			// render.
			apiFetch.use( apiFetch.createPreloadingMiddleware( preload ) );
		}

		root.render(
			<StrictMode>
				<ExperimentalEmailEditor
					postId={ postId }
					postType={ TEMPLATE_POST_TYPE }
					config={ config }
				/>
			</StrictMode>
		);
	} catch ( error ) {
		// The notice deliberately does not name which half failed; this does.
		// eslint-disable-next-line no-console
		console.error( 'Jetpack email design editor:', error );
		root.render( <LoadError /> );
	}
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', mountEmailDesignEditor, { once: true } );
} else {
	mountEmailDesignEditor();
}
