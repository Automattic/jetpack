/**
 * Client-side entry point for the newsletter email design screen.
 *
 * The bundle the editor starts from is fetched here rather than inlined into
 * the page. It lives on the WordPress.com shadow blog, so on Atomic and
 * self-hosted the page would otherwise have to proxy to WordPress.com while
 * rendering, putting a blocking request in front of the screen appearing at
 * all — and on Simple an internal dispatch during the page request breaks the
 * REST preloads that follow it on a blog the editor has not run for before.
 * Fetching from the browser also keeps the template's id something only
 * WordPress.com computes, which is the one field a site must never work out
 * locally. See NL-848 and NL-851.
 *
 * The bundle is also what the editor's own reads are answered from. Its
 * template records are installed as an api-fetch preload before the editor
 * mounts, because they are registered only while WordPress.com builds the
 * bundle and so are absent from any ordinary REST request. See
 * `buildPreloadMap()`.
 *
 * The page is the other half, and is added separately: it renders the
 * container and localises `window.JetpackEmailDesignEditor` with what
 * WordPress.com cannot know — where to mount, where its buttons navigate to,
 * and the half of the editor settings that describes this installation. Until
 * it exists nothing enqueues this bundle, so the mount below returns.
 */
import { ExperimentalEmailEditor } from '@woocommerce/email-editor';
import apiFetch from '@wordpress/api-fetch';
import { Notice } from '@wordpress/components';
import { createRoot, StrictMode } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * The route serving the editor's bootstrap data.
 *
 * Declared by the Jetpack plugin on every platform and answered by
 * WordPress.com, so the browser calls one local URL on Simple, Atomic and
 * self-hosted alike.
 */
const BOOTSTRAP_PATH = '/wpcom/v2/email-editor-bootstrap';

/**
 * The post type the editor edits.
 *
 * A constant rather than something the page supplies: the design is a block
 * template, and unlike the template's id — which is namespaced by whichever
 * theme served it — the post type is the same everywhere.
 */
const TEMPLATE_POST_TYPE = 'wp_template';

/**
 * Schemes the editor's navigation buttons may send the browser to.
 *
 * `javascript:` and `data:` are URLs a browser executes rather than navigates
 * to, and the editor assigns these values straight to `window.location.href`.
 */
const NAVIGABLE_PROTOCOLS = [ 'http:', 'https:' ];

/**
 * Check that a URL the editor will navigate to is one the browser can navigate to.
 *
 * Resolving against the current page is what the editor's own back button does,
 * and it does not neutralise a scheme: relative resolution applies only when the
 * value has no scheme of its own, so `javascript:…` survives the round trip
 * intact. The check therefore has to read the protocol the URL parses to, not
 * the string it started as — the parser also strips leading whitespace, which a
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
 * The editor's `config` prop is not the WordPress.com bootstrap bundle. The
 * bundle arrives in the shape the REST route returns it — `editor_settings`,
 * `editor_theme` — while the package's store reads five camelCased keys off
 * the prop: `editorSettings`, `theme`, `urls`, `userEmail` and
 * `globalStylesPostId`. Passing the bundle through unmapped leaves all five
 * undefined, which is not an error the editor reports — it boots with no
 * settings and no theme.
 *
 * `editorSettings` is assembled from both halves on purpose. WordPress.com
 * removes `__unstableResolvedAssets` and `allowedIframeStyleHandles` from the
 * bundle before returning it, because they describe the installation they were
 * computed on rather than the design; the page supplies this site's own. The
 * page's half is merged last so it wins.
 *
 * @param {object} bundle - The response from the bootstrap route.
 * @param {object} data   - The value of `window.JetpackEmailDesignEditor`.
 * @throws {Error} If either half left out something the editor cannot start without.
 * @return {object} The editor's `config` prop.
 */
export function buildEditorConfig( bundle, data ) {
	const { editorSettings, urls, userEmail, globalStylesPostId } = data;

	// Mirrors what the package's own `initializeEditor()` validates when it reads
	// these from a global. Nothing checks them on the `config` prop path, so an
	// omission would otherwise surface as an unrelated failure deep in the editor.
	if ( ! bundle?.editor_settings ) {
		throw new Error( 'The email editor bundle is missing editor_settings.' );
	}

	if ( ! bundle?.editor_theme ) {
		throw new Error( 'The email editor bundle is missing editor_theme.' );
	}

	if ( typeof urls?.back !== 'string' || typeof urls?.listings !== 'string' ) {
		throw new Error( 'JetpackEmailDesignEditor.urls.back and .listings are required strings.' );
	}

	// Every value here ends up assigned to `window.location.href` by the editor's
	// header buttons, so each has to be somewhere the browser can navigate to and
	// not something it will execute.
	Object.entries( urls ).forEach( ( [ key, value ] ) => assertNavigableUrl( value, key ) );

	return {
		editorSettings: { ...bundle.editor_settings, ...editorSettings },
		theme: bundle.editor_theme,
		urls,
		userEmail,

		// A gate rather than a data source: the record it names is an empty scaffold, and the
		// design itself arrives already merged into `editor_theme`. Measured on WordPress.com,
		// leaving it null makes the package generate no canvas CSS at all — not the saved
		// design, not stock values, no `:root{--wp--preset--…}` block — while naming any valid
		// record paints the whole theme. Nothing here reads the record's contents.
		//
		// Taken from the bundle first for the reason the template's id is: it is a
		// WordPress.com post id, so a page working it out locally is right on Simple, where the
		// site and the shadow blog are the same, and wrong on Atomic and self-hosted. The page
		// remains a fallback so this degrades to the previous behaviour against a bundle that
		// does not carry one yet. See NL-871.
		globalStylesPostId: getGlobalStylesPostId( bundle ) ?? globalStylesPostId ?? null,
	};
}

/**
 * Everything the editor would otherwise fetch, keyed by the path it asks for.
 *
 * Two things travel this way — the canvas templates and the global-styles record — for the same
 * reason: both exist only while WordPress.com builds the bootstrap bundle, so a request made from
 * the browser cannot reach them. Sending the contents and answering the fetch locally sidesteps
 * that rather than working around it.
 *
 * The editor resolves its canvas template through core-data, which fetches
 * `/wp/v2/templates` — the item and the collection both, as observed. On WordPress.com
 * neither answer contains it: the email templates are registered while the bootstrap bundle
 * is built, and that only happens inside the bootstrap request. An ordinary REST request
 * never registers them, so the editor waits on a record that exists only during a different
 * request and never finishes mounting.
 *
 * Registering them server-side for every REST request would fix the fetch and put the email
 * templates in the Site Editor's template list, which is a visible regression on every
 * enrolled blog. Preloading confines them to this page.
 *
 * The records come from the bundle rather than being assembled here. `template` carries four
 * fields; a REST template record carries around fifteen, and the editor reads several of the
 * rest — `post_types` with no optional chaining, so a record without it throws rather than
 * degrading, plus `source`, `origin` and `has_theme_file` when resetting a template. Only
 * WordPress.com holds the real records, the same reason the template's id is handed down
 * rather than derived. Until it sends them there is nothing to preload.
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
 * Validated rather than trusted because this value is interpolated into the preload's path keys.
 * The keys are deliberately exact — the editor loads the *site's own* global-styles record
 * alongside ours, and that one has to keep reaching the network untouched — so an id carrying a
 * query string or a slash would silently widen what we answer for. Rejecting anything that is not
 * a positive integer keeps the code to the invariant its callers document.
 *
 * WordPress.com sends an int today and the filter behind this route is only consulted on Simple,
 * so this is defence in depth rather than a reachable defect. It costs a comparison.
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
 * Both halves are required. The package's selector guards on
 * `postId && undefined !== canEdit`, and `canEdit` comes from `canUser( 'update', … )`, which is
 * an `OPTIONS` request. Answer the `GET` alone and `canEdit` stays undefined, the selector returns
 * null, and the canvas renders unstyled — indistinguishable from the id never having arrived.
 *
 * The record's contents are used, not just its id: measured on WordPress.com by preloading a
 * record whose background differed from the blog's stored design, and the canvas took the
 * record's colour. So this has to carry the body WordPress.com sent, not a placeholder.
 *
 * `Allow` decides how the editor treats it. Without `POST`/`PUT` the package reads through
 * `getEntityRecord` rather than `getEditedEntityRecord`, which is the shape to ship while there
 * is no save interception: the canvas paints and the Styles panel is not editable, so nothing can
 * write to a record we have not yet routed.
 *
 * **Only this one id, never a pattern.** The editor also loads the site's own global-styles record
 * alongside ours — measured as `OPTIONS /wp/v2/global-styles/2` and
 * `GET /wp/v2/global-styles/2?context=edit`, `2` being `wp-global-styles-pub/assembler`. Matching
 * `/wp/v2/global-styles/*` would put the site's own design through the newsletter's plumbing. That
 * record has to keep reaching the network untouched.
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

	const record = { body: globalStyles.record, headers: {} };

	return {
		[ `/wp/v2/global-styles/${ id }` ]: record,
		[ `/wp/v2/global-styles/${ id }?context=view` ]: record,
		[ `/wp/v2/global-styles/${ id }?context=edit` ]: record,

		// OPTIONS responses live under their own top-level key in the preload format.
		OPTIONS: {
			[ `/wp/v2/global-styles/${ id }` ]: {
				body: {},
				headers: { Allow: globalStyles.can_edit ? 'GET, POST, PUT' : 'GET' },
			},
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

	// Callers passing `parse: false` build a Response out of these, and that path reads
	// `headers` unconditionally, so every entry carries one even when it is empty.
	const collection = {
		body: templates,
		headers: {
			'X-WP-Total': String( templates.length ),
			'X-WP-TotalPages': '1',
		},
	};

	// Every context the collection has been seen asked for, including none at all. The two
	// measurements disagree — this editor asks for `?context=edit` on WordPress 7.1, while the
	// same load on WordPress.com carries no context — and a key that goes unmatched costs
	// nothing, whereas the one miss that matters leaves the editor waiting forever.
	const map = {
		'/wp/v2/templates': collection,
		'/wp/v2/templates?context=edit': collection,
		'/wp/v2/templates?context=view': collection,
	};

	const item = templates.find( template => template?.id === templateId );

	if ( item ) {
		const record = { body: item, headers: {} };

		map[ `/wp/v2/templates/${ templateId }` ] = record;
		map[ `/wp/v2/templates/${ templateId }?context=edit` ] = record;
	}

	return map;
}

/**
 * The id of the template the editor opens.
 *
 * Read from the bundle and never derived here. The package builds it as
 * `get_stylesheet() . '//' . $slug` on whichever installation registered the
 * template, so a site working it out locally is right on Simple — where the
 * site and the shadow blog are the same — and wrong on Atomic and self-hosted.
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
 * A blank screen is the failure this is here to avoid: the design lives on
 * another site, so "nothing appeared" and "your design is empty" look the same
 * to whoever opened the page.
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

	// Not our page. The bundle is only enqueued on the design screen, so this is
	// the "loaded somewhere unexpected" case rather than a misconfiguration.
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
			// Registered last so it runs first: api-fetch unshifts middlewares and applies them
			// right to left, so this one sees `options.path` before the locale and WordPress.com
			// rewriting middlewares have rewritten it. It has to be installed before the editor
			// mounts, because core-data resolves the template on its first render.
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
		// The message names which half is at fault, which the notice deliberately
		// does not — but losing it entirely would leave a page with nothing to
		// debug from.
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
