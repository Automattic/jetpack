import { getDestination } from './get-destination';

type Props = Record< string, string | number | undefined >;

interface JQueryEvents {
	on( events: string, handler: ( event: unknown, arg?: unknown ) => void ): void;
	on(
		events: string,
		selector: string,
		handler: ( this: HTMLElement, event: unknown, arg?: unknown ) => void
	): void;
}

declare global {
	interface Window {
		_tkq: unknown[][];
		jQuery?: ( target: Document ) => JQueryEvents;
		wpcomDashboardTracks?: {
			// The site props every event carries. See wpcom_unified_admin_tracks_props().
			props: Props;
			siteDomain: string;
			adminPath: string;
		};
	}
}

const WELCOME_PANEL = 'welcome-panel';
const CLICKABLE = 'a[href], button, input[type="submit"], input[type="button"]';

/**
 * Records a Dashboard Tracks event.
 *
 * @param name  - The event name.
 * @param props - The event props. Unset ones are dropped so they don't reach Tracks as "undefined".
 */
function record( name: string, props: Props ) {
	const eventProps = { ...window.wpcomDashboardTracks?.props };
	for ( const [ key, value ] of Object.entries( props ) ) {
		if ( value !== undefined ) {
			eventProps[ key ] = value;
		}
	}

	window._tkq = window._tkq || [];
	window._tkq.push( [ 'recordEvent', name, eventProps ] );
}

/**
 * Whether the element takes up space on the page.
 *
 * @param element - The element.
 * @return Whether the element is visible.
 */
function isVisible( element: Element ) {
	return element.getClientRects().length > 0;
}

/**
 * The widget's column, and its position among the visible widgets in that column.
 *
 * @param widget - The widget element.
 * @return The column and 1-based position, or nothing for a hidden widget or the Welcome panel.
 */
function getLayout( widget: HTMLElement ): Props {
	const container = widget.closest( '.postbox-container' );
	const sortables = widget.closest( '.meta-box-sortables' );
	if ( ! container || ! sortables || ! isVisible( widget ) ) {
		return {};
	}

	const visibleWidgets = Array.from( sortables.children ).filter(
		child => child.classList.contains( 'postbox' ) && isVisible( child )
	);

	return {
		column: Number( container.id.replace( 'postbox-container-', '' ) ) || undefined,
		position: visibleWidgets.indexOf( widget ) + 1,
	};
}

/**
 * Whether the widget is hidden from Screen Options, collapsed, or open.
 *
 * @param widget - The widget element.
 * @return The widget state.
 */
function getState( widget: HTMLElement ) {
	if ( ! isVisible( widget ) ) {
		return 'hidden';
	}
	return widget.classList.contains( 'closed' ) ? 'collapsed' : 'visible';
}

/**
 * Records a hide, show, collapse, expand, move, drag, or dismiss of a widget.
 *
 * @param widgetId - The widget ID.
 * @param action   - What happened to it.
 * @param widget   - The widget element, to record where it ended up.
 */
function recordToggle( widgetId: string, action: string, widget?: HTMLElement | null ) {
	record( 'wpcom_admin_dashboard_widget_toggle', {
		widget_id: widgetId,
		action,
		...( widget ? getLayout( widget ) : {} ),
	} );
}

/**
 * Records clicks on links and buttons inside widgets, and the move and dismiss controls.
 *
 * Runs in the capture phase so widgets that stop propagation are still counted, and so the move
 * buttons are read before core updates them.
 *
 * @param event - The click or middle click.
 */
function onClick( event: MouseEvent ) {
	const control =
		event.target instanceof Element ? event.target.closest< HTMLElement >( CLICKABLE ) : null;
	if ( ! control ) {
		return;
	}

	if ( control.matches( '.welcome-panel-close' ) ) {
		recordToggle( WELCOME_PANEL, 'dismiss' );
		return;
	}

	const widget = control.closest< HTMLElement >( '#dashboard-widgets .postbox' );
	if ( widget && control.matches( '.handle-order-higher, .handle-order-lower' ) ) {
		// Core disables the button at either end of the layout, and does nothing on a click.
		if ( 'click' === event.type && 'true' !== control.getAttribute( 'aria-disabled' ) ) {
			const action = control.matches( '.handle-order-higher' ) ? 'move_up' : 'move_down';
			setTimeout( () => recordToggle( widget.id, action, widget ) );
		}
		return;
	}

	const widgetId = control.closest( '#welcome-panel' )
		? WELCOME_PANEL
		: control.closest( '#dashboard-widgets .postbox .inside' ) && widget?.id;
	if ( ! widgetId ) {
		return;
	}

	const href = control instanceof HTMLAnchorElement ? control.getAttribute( 'href' ) : null;
	const destination =
		href && ! href.startsWith( '#' )
			? getDestination( control.href, {
					origin: window.location.origin,
					domain: window.wpcomDashboardTracks?.siteDomain ?? '',
					adminPath: window.wpcomDashboardTracks?.adminPath ?? '/wp-admin/',
				} )
			: `button${ control.id ? `#${ control.id }` : '' }`;

	record( 'wpcom_admin_dashboard_widget_click', { widget_id: widgetId, destination } );
}

/**
 * Records what the Dashboard renders, then listens for what people do with it.
 */
function wpcomDashboardTracks() {
	const widgets = Array.from(
		document.querySelectorAll< HTMLElement >( '#dashboard-widgets .postbox' )
	);

	for ( const widget of widgets ) {
		record( 'wpcom_admin_dashboard_widget_render', {
			widget_id: widget.id,
			state: getState( widget ),
			...getLayout( widget ),
		} );
	}

	const welcomePanel = document.getElementById( WELCOME_PANEL );
	if ( welcomePanel ) {
		record( 'wpcom_admin_dashboard_widget_render', {
			widget_id: WELCOME_PANEL,
			state: isVisible( welcomePanel ) ? 'visible' : 'hidden',
		} );
	}

	document.addEventListener( 'click', onClick, true );
	document.addEventListener(
		'auxclick',
		event => {
			if ( 1 === event.button ) {
				onClick( event );
			}
		},
		true
	);

	// Screen Options checkboxes. Core shows or hides the widget on click, before this fires.
	document.addEventListener( 'change', event => {
		const input = event.target;
		if ( ! ( input instanceof HTMLInputElement ) ) {
			return;
		}

		if ( input.classList.contains( 'hide-postbox-tog' ) ) {
			recordToggle(
				input.value,
				input.checked ? 'show' : 'hide',
				document.getElementById( input.value )
			);
		} else if ( 'wp_welcome_panel-hide' === input.id ) {
			recordToggle( WELCOME_PANEL, input.checked ? 'show' : 'hide' );
		}
	} );

	const $document = window.jQuery?.( document );
	if ( ! $document ) {
		return;
	}

	// Core fires postbox-toggled for Screen Options hide and show too, which the closed state tells apart.
	const closed = new Map(
		widgets.map( widget => [ widget.id, widget.classList.contains( 'closed' ) ] )
	);
	$document.on( 'postbox-toggled', ( _event, postbox ) => {
		const widget = ( ( postbox as ArrayLike< unknown > )?.[ 0 ] ?? postbox ) as HTMLElement;
		if ( ! ( widget instanceof HTMLElement ) || ! closed.has( widget.id ) ) {
			return;
		}

		const isClosed = widget.classList.contains( 'closed' );
		if ( closed.get( widget.id ) !== isClosed ) {
			closed.set( widget.id, isClosed );
			recordToggle( widget.id, isClosed ? 'collapse' : 'expand', widget );
		}
	} );

	// A drag between columns fires on both; record it once, from the column it landed in.
	$document.on( 'sortupdate', '#dashboard-widgets .meta-box-sortables', function ( _event, ui ) {
		const widget = ( ui as { item?: ArrayLike< unknown > } )?.item?.[ 0 ];
		if ( widget instanceof HTMLElement && this.contains( widget ) ) {
			recordToggle( widget.id, 'drag', widget );
		}
	} );
}

wpcomDashboardTracks();
