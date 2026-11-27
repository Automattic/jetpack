/**
 * Tracks helpers replacing Calypso's analytics actions and middleware; "actions" are thunks run by `useDispatch()`.
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import config from './config';

type Props = Record< string, unknown >;
export type AnalyticsAction = () => void;

let identified = false;

/**
 * Identify the tracker with the connected WordPress.com user, once.
 */
function identify() {
	if ( identified ) {
		return;
	}
	identified = true;
	const user = config( 'initial_state' )?.currentUser?.user;
	if ( user?.ID && user?.username && user.username !== 'no-user' ) {
		jetpackAnalytics.initialize( user.ID, user.username, { blog_id: config( 'blog_id' ) } );
	}
}

/**
 * Record a Tracks event right away.
 *
 * @param name  - Event name.
 * @param props - Event properties.
 */
export function recordTracksEventNow( name: string, props: Props = {} ) {
	identify();
	jetpackAnalytics.tracks.recordEvent( name, { blog_id: config( 'blog_id' ), ...props } );
}

/**
 * Tracks event as a dispatchable action.
 *
 * @param name  - Event name.
 * @param props - Event properties.
 * @return Action.
 */
export const recordTracksEvent =
	( name: string, props: Props = {} ): AnalyticsAction =>
	() =>
		recordTracksEventNow( name, props );

/**
 * Bump an MC stat as a dispatchable action.
 *
 * @param group - Stat group.
 * @param name  - Stat name.
 * @return Action.
 */
export const bumpStat =
	( group: string, name: string ): AnalyticsAction =>
	() => {
		const img = new window.Image();
		img.src = `https://pixel.wp.com/g.gif?v=wpcom-no-pv&x_${ encodeURIComponent(
			group
		) }=${ encodeURIComponent( name ) }&t=${ Math.random() }`;
	};

/**
 * Combine several actions into one.
 *
 * @param actions - Actions.
 * @return Action.
 */
export const composeAnalytics =
	( ...actions: AnalyticsAction[] ): AnalyticsAction =>
	() =>
		actions.forEach( action => action() );

/**
 * Record a page view the way Calypso's `recordPageView` did.
 *
 * @param path       - Route path, with placeholders.
 * @param title      - Page title.
 * @param properties - Extra properties.
 */
export function recordPageView( path: string, title: string, properties: Props = {} ) {
	recordTracksEventNow( 'calypso_page_view', { path, title, ...properties } );
}
