/**
 * What the email editor's Styles panel calls each control on this screen.
 *
 * Its own module, and imported before the package: the package builds each screen's title and
 * description at module scope, so a filter added any later never sees them.
 */
import { addFilter } from '@wordpress/hooks';
import { _x } from '@wordpress/i18n';

// This filter's namespace. Independent of the entry point's plugin name — nothing pairs them.
const FILTER_NAMESPACE = 'jetpack/email-design-labels';

// The Styles panel's own container, which `ComplementaryArea` ids after the panel's identifier.
export const STYLES_SIDEBAR_ID = 'null:email-styles-sidebar';

// Words plain enough that something else on this screen could ask for them, and the reason the
// answers below are not given unconditionally.
const SHARED_WORDS = new Set( [ 'Text', 'Headings', 'Layout' ] );

// True while our own import graph is still executing, which is when the package resolves its
// screens' titles and nothing else on the page can be asking for a translation. A microtask runs
// once every module body has, and long before the first render.
let resolvingModules = true;

Promise.resolve().then( () => {
	resolvingModules = false;
} );

// Built on first use so the labels resolve once the page's translations have loaded.
let sidebarLabels = null;

/**
 * What the Styles panel's labels should say on this screen, keyed by what the package says.
 *
 * The package inherited the site editor's labels wholesale, and an email's parts are not a site's:
 * "Text" is the default everything else falls back to, and the Headings screen's H1 is the post
 * title. See NL-955.
 *
 * Keyed by the package's English source, so a bump that rewords one drops that override rather
 * than mistranslating it. In the `jetpack` domain and not the package's own: the build stamps
 * `__i18n_text_domain__`, so the bundled package asks for its strings in ours.
 *
 * The replacements are `_x()` calls, which run a different filter chain. `__()` here would re-enter
 * this one while the map is still being built.
 *
 * "Typography" is deliberately absent: the package says it as the nav item, as that screen's
 * header, and again as the panel inside it, and the source string is all this filter gets to tell
 * the three apart. That one belongs upstream.
 *
 * @return {Map<string, string>} Replacements, keyed by source string.
 */
function stylesSidebarLabels() {
	if ( ! sidebarLabels ) {
		sidebarLabels = new Map( [
			[ 'Text', _x( 'Default text', 'email design styles', 'jetpack' ) ],
			[
				'Manage the fonts and typography used on text.',
				_x(
					'The default for the whole email: post body, byline and footer. Headings and buttons inherit anything you don’t set for them.',
					'email design styles',
					'jetpack'
				),
			],
			[
				'Manage the fonts and typography used on links.',
				_x(
					'Links inside your post. Footer links take their color from Default text.',
					'email design styles',
					'jetpack'
				),
			],
			[ 'Headings', _x( 'Titles & headings', 'email design styles', 'jetpack' ) ],
			[
				'Manage the fonts and typography used on headings.',
				_x(
					'H1 styles your post title, H2 your site title and post headings, and H3–H6 the headings inside your post. The site title follows H2’s font only, not its size. All headings applies wherever you haven’t styled a level individually.',
					'email design styles',
					'jetpack'
				),
			],
			[
				'Manage the fonts and typography used on buttons.',
				_x(
					'Buttons in your post. The Comment and Like buttons follow the font here, but nothing else. A button that sets its own style in the post keeps it.',
					'email design styles',
					'jetpack'
				),
			],

			// The package says this a third time on a block layout control, which
			// `lockCanvasEditing()` has taken off this screen.
			[ 'Layout', _x( 'Spacing', 'email design styles', 'jetpack' ) ],
			[
				'Manage the background color of the email.',
				_x(
					'The color behind the whole email, both the page and the content card.',
					'email design styles',
					'jetpack'
				),
			],
		] );
	}

	return sidebarLabels;
}

/**
 * Answer the package's own label where we have a better one.
 *
 * A source string is all a gettext filter gets, so a bare "Text" from anything else on this screen
 * would be answered too. The Styles panel and the block inspector are the same region, so the words
 * that are not ours alone are answered only while that panel holds it.
 *
 * @param {string} translation - What the package's own translation resolved to.
 * @param {string} text        - The English source string it was asked for.
 * @return {string} Ours, or the package's untouched.
 */
export function relabelStylesSidebar( translation, text ) {
	const labels = stylesSidebarLabels();

	if ( ! labels.has( text ) ) {
		return translation;
	}

	if (
		SHARED_WORDS.has( text ) &&
		! resolvingModules &&
		! document.getElementById( STYLES_SIDEBAR_ID )
	) {
		return translation;
	}

	return labels.get( text );
}

/**
 * Say what each Styles control changes, in this newsletter's terms.
 *
 * Registered on import rather than once the bootstrap has answered, for the reason above. The
 * screen is this bundle's only page, so nothing else is in range of it.
 */
addFilter( 'i18n.gettext_jetpack', FILTER_NAMESPACE, relabelStylesSidebar );
