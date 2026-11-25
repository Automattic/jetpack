export type SurfaceEvent =
	| {
			/*
			 * What happened to an announcement on the surface.
			 */
			type: 'teaserView' | 'teaserOpen' | 'teaserDismiss' | 'readerLinkClick';

			/*
			 * The id of the announcement.
			 */
			announcementId: string;
	  }
	| {
			/*
			 * The user changed the switch of the teaser.
			 */
			type: 'teaserSwitch';

			/*
			 * Whether the teaser is on after the change.
			 */
			isOn: boolean;
	  };

type Listener = ( event: SurfaceEvent ) => void;

const listeners = new Set< Listener >();

/**
 * Tells what happened on the surface to whoever listens. Nobody has to.
 *
 * @param {SurfaceEvent} event - The event.
 */
export function emitSurfaceEvent( event: SurfaceEvent ): void {
	listeners.forEach( listener => listener( event ) );
}

/**
 * Listens to the events of the surface, for the rest of the page load.
 *
 * @param {Listener} listener - Called with each event.
 */
export function onSurfaceEvent( listener: Listener ): void {
	listeners.add( listener );
}
