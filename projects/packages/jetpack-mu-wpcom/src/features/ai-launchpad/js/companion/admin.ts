/**
 * AI Launchpad companion, admin-chrome bundle (DSGCOM-760 prototypes).
 *
 * Runs on every wp-admin screen of a demo site. Renders the variant switcher, injects
 * the sidebar widgets (variants 3 and 4), and live-updates itself plus the server-rendered
 * admin bar item (variant 2) when the editor bundle refreshes the shared state.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	EVENT_PUBLISHED,
	EVENT_UPDATE,
	getData,
	miniTasksHtml,
	countLine,
	progressPct,
	esc,
	ICON_CHECK,
	ICON_CHEVRON_RIGHT,
	type CompanionData,
} from './shared.ts';

/** How long the variant-3 completion toast stays up. */
const TOAST_MS = 12000;

/**
 * "n/m completed" (variant 3's compact count line).
 *
 * @param data - The companion data.
 * @return The count line.
 */
function slashCountLine( data: CompanionData ): string {
	return sprintf(
		/* translators: 1: number of completed tasks, 2: total number of tasks. */
		__( '%1$d/%2$d completed', 'jetpack-mu-wpcom' ),
		data.done,
		data.total
	);
}

/**
 * The variant switcher: a fixed bar at the bottom of the screen, matching the HTML
 * prototype's demo chrome. Links go through the server-side option handler.
 *
 * @param data - The companion data.
 */
function renderSwitcher( data: CompanionData ) {
	const labels: Record< number, string > = {
		0: __( 'Off', 'jetpack-mu-wpcom' ),
		1: __( '1 · Floating list', 'jetpack-mu-wpcom' ),
		2: __( '2 · Admin bar', 'jetpack-mu-wpcom' ),
		3: __( '3 · Sidebar top', 'jetpack-mu-wpcom' ),
		4: __( '4 · Sidebar bottom', 'jetpack-mu-wpcom' ),
		5: __( '5 · Snackbar', 'jetpack-mu-wpcom' ),
	};

	const links = [ 1, 2, 3, 4, 5, 0 ]
		.map( variant => {
			const href = data.urls.variant.replace( '%d', String( variant ) );
			const on = variant === data.variant ? ' is-on' : '';
			return `<a class="ai-lpc-switcher-item${ on }" href="${ esc( href ) }">${ esc(
				labels[ variant ]
			) }</a>`;
		} )
		.join( '' );

	const bar = document.createElement( 'div' );
	bar.id = 'ai-lpc-switcher';
	bar.innerHTML =
		links +
		'<span class="ai-lpc-switcher-sep"></span>' +
		`<a class="ai-lpc-switcher-item is-replay" href="${ esc( data.urls.reset ) }">${ esc(
			__( 'Restart flow', 'jetpack-mu-wpcom' )
		) }</a>`;
	document.body.appendChild( bar );
}

/**
 * Variant 3: the Wix-style progress module above the admin menu, with a next-step
 * flyout on hover and a hidden completion toast the publish event reveals.
 *
 * @param data - The companion data.
 * @return The module element.
 */
function renderSidebarTopModule( data: CompanionData ): HTMLElement | null {
	const menu = document.getElementById( 'adminmenu' );
	if ( ! menu ) {
		return null;
	}

	const item = document.createElement( 'li' );
	item.className = 'ai-lpc-menu-module-wrap';
	item.innerHTML =
		`<a class="ai-lpc-menu-module" href="${ esc( data.urls.launchpad ) }">` +
		'<span class="ai-lpc-module-row1">' +
		`<strong>${ esc( __( 'Site Setup', 'jetpack-mu-wpcom' ) ) }</strong>` +
		`<span class="ai-lpc-module-chev">${ ICON_CHEVRON_RIGHT }</span>` +
		'</span>' +
		`<span class="ai-lpc-long-bar"><span class="ai-lpc-long-bar-fill" style="width:${ progressPct(
			data
		) }"></span></span>` +
		`<span class="ai-lpc-module-count">${ esc( slashCountLine( data ) ) }</span>` +
		'</a>' +
		'<span class="ai-lpc-flyout-wrap"><span class="ai-lpc-flyout">' +
		`<span class="ai-lpc-flyout-eyebrow">${ esc( __( 'Next step', 'jetpack-mu-wpcom' ) ) }</span>` +
		`<strong class="ai-lpc-flyout-title">${ esc( data.next?.title ?? '' ) }</strong>` +
		`<span class="ai-lpc-flyout-sub">${ esc( data.next?.subtitle ?? '' ) }</span>` +
		`<a class="ai-lpc-button" href="${ esc( data.urls.launchpad ) }">${ esc(
			__( 'Continue setup', 'jetpack-mu-wpcom' )
		) }</a>` +
		'</span></span>' +
		'<span class="ai-lpc-side-toast" hidden>' +
		`<button type="button" class="ai-lpc-toast-close" aria-label="${ esc(
			__( 'Dismiss', 'jetpack-mu-wpcom' )
		) }">&times;</button>` +
		'<span class="ai-lpc-toast-row">' +
		`<span class="ai-lpc-toast-badge">${ ICON_CHECK }</span>` +
		'<span>' +
		'<strong class="ai-lpc-toast-title"></strong>' +
		'<span class="ai-lpc-toast-sub"></span>' +
		'</span></span>' +
		'</span>';

	menu.insertBefore( item, menu.firstChild );

	const close = item.querySelector( '.ai-lpc-toast-close' );
	close?.addEventListener( 'click', () => {
		const toast = item.querySelector< HTMLElement >( '.ai-lpc-side-toast' );
		if ( toast ) {
			toast.hidden = true;
		}
	} );

	return item;
}

/**
 * Variant 4: the Chatbase-style widget pinned under the admin menu (the Site Setup
 * menu item itself is hidden by the variant-4 body class in CSS).
 *
 * @param data - The companion data.
 * @return The widget element.
 */
function renderSidebarBottomWidget( data: CompanionData ): HTMLElement | null {
	const menu = document.getElementById( 'adminmenu' );
	if ( ! menu ) {
		return null;
	}

	const item = document.createElement( 'li' );
	item.className = 'ai-lpc-menu-bottom-wrap';
	item.innerHTML =
		`<a class="ai-lpc-menu-bottom" href="${ esc( data.urls.launchpad ) }">` +
		'<span class="ai-lpc-bottom-row1">' +
		`${ esc( __( 'Site Setup', 'jetpack-mu-wpcom' ) ) }` +
		`<span class="ai-lpc-module-chev">${ ICON_CHEVRON_RIGHT }</span>` +
		'</span>' +
		`<span class="ai-lpc-bottom-count">${ esc( spacedCountLine( data ) ) }</span>` +
		`<span class="ai-lpc-long-bar"><span class="ai-lpc-long-bar-fill" style="width:${ progressPct(
			data
		) }"></span></span>` +
		'</a>';

	const collapse = document.getElementById( 'collapse-menu' );
	if ( collapse && collapse.parentElement === menu ) {
		menu.insertBefore( item, collapse );
	} else {
		menu.appendChild( item );
	}

	return item;
}

/**
 * "n / m completed" (variant 4's count line).
 *
 * @param data - The companion data.
 * @return The count line.
 */
function spacedCountLine( data: CompanionData ): string {
	return sprintf(
		/* translators: 1: number of completed tasks, 2: total number of tasks. */
		__( '%1$d / %2$d completed', 'jetpack-mu-wpcom' ),
		data.done,
		data.total
	);
}

/**
 * Refresh whichever companion chrome is on the page from the shared state: the
 * sidebar module (3), the bottom widget (4), and the admin bar item (2).
 *
 * @param data - The companion data.
 */
function updateWidgets( data: CompanionData ) {
	document.querySelectorAll< HTMLElement >( '.ai-lpc-long-bar-fill' ).forEach( fill => {
		fill.style.width = progressPct( data );
	} );

	const moduleCount = document.querySelector( '.ai-lpc-module-count' );
	if ( moduleCount ) {
		moduleCount.textContent = slashCountLine( data );
	}

	const bottomCount = document.querySelector( '.ai-lpc-bottom-count' );
	if ( bottomCount ) {
		bottomCount.textContent = spacedCountLine( data );
	}

	const flyoutTitle = document.querySelector( '.ai-lpc-flyout-title' );
	const flyoutSub = document.querySelector( '.ai-lpc-flyout-sub' );
	if ( flyoutTitle ) {
		flyoutTitle.textContent = data.next?.title ?? '';
	}
	if ( flyoutSub ) {
		flyoutSub.textContent = data.next?.subtitle ?? '';
	}

	// The admin bar item (server-rendered when variant 2 is active).
	const abLabel = document.querySelector( '#wp-admin-bar-ai-launchpad-companion .ai-lpc-ab-label' );
	if ( abLabel ) {
		abLabel.textContent = sprintf(
			/* translators: 1: number of completed tasks, 2: total number of tasks. */
			__( 'Site Setup (%1$d/%2$d)', 'jetpack-mu-wpcom' ),
			data.done,
			data.total
		);
	}
	document
		.querySelectorAll< HTMLElement >(
			'#wp-admin-bar-ai-launchpad-companion .ai-lpc-ab-progress-fill, #wp-admin-bar-ai-launchpad-companion .ai-lpc-popover-bar-fill'
		)
		.forEach( fill => {
			fill.style.width = progressPct( data );
		} );
	const popoverCount = document.querySelector(
		'#wp-admin-bar-ai-launchpad-companion .ai-lpc-popover-count'
	);
	if ( popoverCount ) {
		popoverCount.textContent = countLine( data );
	}
	const popoverTasks = document.querySelector(
		'#wp-admin-bar-ai-launchpad-companion .ai-lpc-mini-tasks'
	);
	if ( popoverTasks ) {
		popoverTasks.innerHTML = miniTasksHtml( data );
	}
}

/**
 * Celebrate newly completed tasks: variant 3 shows its toast at the module, variant 4
 * pulses the widget.
 *
 * @param data         - The companion data.
 * @param completedIds - The ids that flipped to completed.
 */
function celebrate( data: CompanionData, completedIds: string[] ) {
	const remaining = Math.max( 0, data.total - data.done );
	const isFirstPost = completedIds.some( id => id.startsWith( 'first_post_published' ) );

	const toast = document.querySelector< HTMLElement >( '.ai-lpc-side-toast' );
	if ( toast ) {
		const title = toast.querySelector( '.ai-lpc-toast-title' );
		const sub = toast.querySelector( '.ai-lpc-toast-sub' );
		if ( title ) {
			title.textContent = isFirstPost
				? __( 'First post published!', 'jetpack-mu-wpcom' )
				: __( 'Task completed!', 'jetpack-mu-wpcom' );
		}
		if ( sub ) {
			sub.textContent = sprintf(
				/* translators: 1: completed count, 2: total count, 3: remaining count. */
				__( '%1$d of %2$d steps done. Keep going, %3$d to launch.', 'jetpack-mu-wpcom' ),
				data.done,
				data.total,
				remaining
			);
		}
		toast.hidden = false;
		window.setTimeout( () => {
			toast.hidden = true;
		}, TOAST_MS );
	}

	const widget = document.querySelector< HTMLElement >( '.ai-lpc-menu-bottom' );
	if ( widget ) {
		widget.classList.remove( 'is-pulsing' );
		// Restart the CSS animation.
		void widget.offsetWidth;
		widget.classList.add( 'is-pulsing' );
	}
}

/**
 * Boot the admin-chrome bundle.
 */
function init() {
	const data = getData();
	if ( ! data ) {
		return;
	}

	if ( data.showSwitcher ) {
		renderSwitcher( data );
	}

	if ( data.active && data.variant === 3 ) {
		renderSidebarTopModule( data );
	}
	if ( data.active && data.variant === 4 ) {
		renderSidebarBottomWidget( data );
	}

	document.addEventListener( EVENT_UPDATE, () => {
		const fresh = getData();
		if ( fresh ) {
			updateWidgets( fresh );
		}
	} );

	document.addEventListener( EVENT_PUBLISHED, event => {
		const fresh = getData();
		const completedIds: string[] =
			( event as CustomEvent< { completedIds: string[] } > ).detail?.completedIds ?? [];
		if ( fresh ) {
			celebrate( fresh, completedIds );
		}
	} );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
