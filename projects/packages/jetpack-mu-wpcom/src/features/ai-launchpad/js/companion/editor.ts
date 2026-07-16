/**
 * AI Launchpad companion, editor bundle (DSGCOM-760 prototypes).
 *
 * Runs in the post editor of a demo site. Owns publish detection (refreshing the shared
 * state the admin-chrome bundle re-renders from), the fullscreen-mode preference per
 * variant, the floating tasklist card (variant 1), and the completion snackbar (variant 5).
 */
import apiFetch from '@wordpress/api-fetch';
import { dispatch, select, subscribe } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import {
	EVENT_UPDATE,
	getData,
	miniTasksHtml,
	countLine,
	ringHtml,
	esc,
	refreshData,
	ICON_CHEVRON_DOWN,
	ICON_CHEVRON_UP,
	type CompanionData,
} from './shared.ts';

/**
 * The ids `@wordpress/editor` has given its own save-success snackbar over time
 * ('editor-save' currently, 'SAVE_POST_NOTICE_ID' in older releases).
 */
const CORE_SAVE_NOTICE_IDS = [ 'editor-save', 'SAVE_POST_NOTICE_ID' ];

/**
 * Pin the editor's fullscreen mode per variant: the floating card (1) and the snackbar (5)
 * demo the fullscreen editor, the chrome widgets (2, 3, 4) need wp-admin chrome visible.
 * Written to both preference scopes so it works across Gutenberg versions.
 *
 * @param variant - The active variant.
 */
function pinFullscreenMode( variant: number ) {
	const wantFullscreen = variant === 1 || variant === 5;

	const apply = () => {
		try {
			const preferences = dispatch( 'core/preferences' ) as
				| { set: ( scope: string, key: string, value: unknown ) => void }
				| undefined;
			if ( ! preferences || typeof preferences.set !== 'function' ) {
				return false;
			}
			preferences.set( 'core/edit-post', 'fullscreenMode', wantFullscreen );
			preferences.set( 'core', 'fullscreenMode', wantFullscreen );
			return true;
		} catch {
			return false;
		}
	};

	// The preferences store may register after this bundle runs; retry briefly.
	if ( ! apply() ) {
		let attempts = 0;
		const timer = window.setInterval( () => {
			if ( apply() || ++attempts > 20 ) {
				window.clearInterval( timer );
			}
		}, 250 );
	}
}

/**
 * Call back exactly once each time the current post transitions to `publish`
 * through a successful non-autosave save.
 *
 * @param onPublish - The publish callback.
 */
function watchPublish( onPublish: () => void ) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the editor store has no exported selector types here.
	const editor = select( 'core/editor' ) as any;
	if ( ! editor ) {
		return;
	}

	let lastStatus: string | undefined = editor.getCurrentPostAttribute?.( 'status' );
	let sawSave = false;

	subscribe( () => {
		const isSaving = editor.isSavingPost() && ! editor.isAutosavingPost();

		if ( isSaving ) {
			sawSave = true;
			return;
		}

		if ( ! sawSave ) {
			if ( lastStatus === undefined ) {
				lastStatus = editor.getCurrentPostAttribute?.( 'status' );
			}
			return;
		}

		sawSave = false;
		if ( ! editor.didPostSaveRequestSucceed() ) {
			return;
		}

		const status: string | undefined = editor.getCurrentPostAttribute?.( 'status' );
		if ( 'publish' === status && 'publish' !== lastStatus ) {
			lastStatus = status;
			onPublish();
			return;
		}
		lastStatus = status;
	} );
}

/**
 * Variant 5: replace the editor's own "Post published." snackbar with one that carries
 * the setup progress and a "Continue setup" action, using the stock notices store
 * (so it renders as the real `.components-snackbar`).
 *
 * @param data - The refreshed companion data.
 */
function showSnackbar( data: CompanionData ) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the notices store has no exported action types here.
	const notices = dispatch( 'core/notices' ) as any;
	if ( ! notices ) {
		return;
	}

	// The core notice can land after this subscriber fires, so keep sweeping it
	// away for a few seconds instead of racing it with one-shot removals.
	const removeCoreNotice = () => CORE_SAVE_NOTICE_IDS.forEach( id => notices.removeNotice( id ) );
	removeCoreNotice();
	let sweeps = 0;
	const sweeper = window.setInterval( () => {
		removeCoreNotice();
		if ( ++sweeps >= 20 ) {
			window.clearInterval( sweeper );
		}
	}, 250 );

	notices.createNotice(
		'success',
		sprintf(
			/* translators: 1: number of completed tasks, 2: total number of tasks. */
			__( 'Post published. %1$d of %2$d setup tasks done.', 'jetpack-mu-wpcom' ),
			data.done,
			data.total
		),
		{
			id: 'ai-lpc-continue-setup',
			type: 'snackbar',
			actions: [
				{
					label: __( 'Continue setup', 'jetpack-mu-wpcom' ),
					url: data.urls.launchpad,
				},
			],
		}
	);
}

/**
 * Variant 1: the floating tasklist. A pill (collapsed) or card (expanded) fixed to the
 * bottom-right of the editor, following the user through the task. Publish expands it,
 * ticks the task, and pulses the card.
 */
class FloatingCard {
	private root: HTMLElement;
	private expanded = false;

	public constructor( private data: CompanionData ) {
		this.root = document.createElement( 'div' );
		this.root.id = 'ai-lpc-float';
		document.body.appendChild( this.root );
		this.render();

		document.addEventListener( EVENT_UPDATE, () => {
			const fresh = getData();
			if ( fresh ) {
				this.data = fresh;
				this.render();
			}
		} );
	}

	public expandAndPulse() {
		this.expanded = true;
		this.render();
		const card = this.root.querySelector( '.ai-lpc-float-card' );
		if ( card ) {
			card.classList.remove( 'is-pulsing' );
			void ( card as HTMLElement ).offsetWidth;
			card.classList.add( 'is-pulsing' );
		}
	}

	private render() {
		const { data } = this;

		if ( ! this.expanded ) {
			this.root.innerHTML =
				'<button type="button" class="ai-lpc-float-pill">' +
				ringHtml( data, 26 ) +
				`<span>${ esc( __( 'Site setup', 'jetpack-mu-wpcom' ) ) }</span>` +
				ICON_CHEVRON_UP +
				'</button>';
			this.root
				.querySelector( '.ai-lpc-float-pill' )
				?.addEventListener( 'click', () => this.toggle( true ) );
			return;
		}

		const cta = data.next
			? `<a class="ai-lpc-button" href="${ esc( data.next.ctaUrl || data.urls.launchpad ) }">${ esc(
					data.next.ctaLabel
			  ) }</a>`
			: `<a class="ai-lpc-button" href="${ esc( data.urls.launchpad ) }">${ esc(
					__( 'Continue setup', 'jetpack-mu-wpcom' )
			  ) }</a>`;

		this.root.innerHTML =
			'<div class="ai-lpc-float-card">' +
			'<div class="ai-lpc-float-header">' +
			ringHtml( data, 44 ) +
			'<div class="ai-lpc-float-titles">' +
			`<a class="ai-lpc-float-link" href="${ esc( data.urls.launchpad ) }">${ esc(
				__( 'Site setup', 'jetpack-mu-wpcom' )
			) }</a>` +
			`<span class="ai-lpc-float-sub">${ esc( countLine( data ) ) }</span>` +
			'</div>' +
			`<button type="button" class="ai-lpc-float-collapse" aria-label="${ esc(
				__( 'Collapse', 'jetpack-mu-wpcom' )
			) }">${ ICON_CHEVRON_DOWN }</button>` +
			'</div>' +
			`<div class="ai-lpc-float-tasks">${ miniTasksHtml( data ) }</div>` +
			`<div class="ai-lpc-float-footer">${ cta }</div>` +
			'</div>';

		this.root
			.querySelector( '.ai-lpc-float-collapse' )
			?.addEventListener( 'click', () => this.toggle( false ) );
	}

	private toggle( expanded: boolean ) {
		this.expanded = expanded;
		this.render();
	}
}

/**
 * Boot the editor bundle.
 */
function init() {
	const data = getData();
	if ( ! data || ! data.active ) {
		return;
	}

	pinFullscreenMode( data.variant );

	let card: FloatingCard | null = null;
	if ( data.variant === 1 ) {
		card = new FloatingCard( data );
	}

	watchPublish( async () => {
		// The catalog listener marked the task complete during the save request,
		// so a refetch already sees the new state.
		let fresh = await refreshData();
		if ( ! fresh ) {
			return;
		}

		// Demo-reliability net: on some sites the publish-time listeners never land the
		// status write. When the first-post task still reads incomplete, ask the
		// companion's own route to record it, then refresh again.
		const firstPostIncomplete = fresh.tasks.some(
			task => task.id.startsWith( 'first_post_published' ) && ! task.completed
		);
		if ( firstPostIncomplete ) {
			try {
				const result = await apiFetch< { completed: boolean } >( {
					path: '/wpcom/v2/ai-launchpad-companion/complete-first-post',
					method: 'POST',
				} );
				if ( result.completed ) {
					fresh = ( await refreshData() ) ?? fresh;
				}
			} catch {
				// The route is demo plumbing; a failure just leaves the task as is.
			}
		}

		if ( fresh.variant === 1 && card ) {
			card.expandAndPulse();
		}
		if ( fresh.variant === 5 ) {
			showSnackbar( fresh );
		}
	} );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
