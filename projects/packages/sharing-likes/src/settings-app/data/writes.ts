import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { configures } from '../types';
import * as api from './api';
import { errorMessage } from './error-message';
import type { ThunkDispatch, ThunkSelect, WriteKind } from './store';
import type {
	CustomServiceFields,
	Feature,
	Service,
	ServiceRow,
	Services,
	SettingKey,
	Settings,
} from '../types';
import type { dispatch as registryDispatch } from '@wordpress/data';

interface ThunkArgs {
	select: ThunkSelect;
	dispatch: ThunkDispatch;
	registry: { dispatch: typeof registryDispatch };
}

export interface ServiceLists {
	visible: string[];
	hidden: string[];
}

export interface SaveServicesOptions {
	message?: string;
	// Where a removed service sat, so Undo can put it back without reverting anything saved since.
	undo?: { id: string; row: ServiceRow; index: number };
}

// One snackbar for a run of moves, rather than one per tap.
const SAVED_NOTICE_ID = 'sharing-likes-services-saved';

// The tail of each registry's write queue: every write waits for the one before it, rereads included.
const queues = new WeakMap< object, Promise< unknown > >();

/**
 * Run a write once every write queued before it has finished, so requests reach the server in order.
 *
 * @param args - Thunk arguments.
 * @param kind - Write kind, counted while queued or in flight.
 * @param task - Request, and whatever must finish before the next write starts.
 * @return What the task returns.
 */
async function queued< T >( args: ThunkArgs, kind: WriteKind, task: () => Promise< T > ) {
	args.dispatch.writeStarted( kind );
	const run = ( queues.get( args.registry ) ?? Promise.resolve() ).then( task );
	queues.set(
		args.registry,
		run.catch( () => undefined )
	);
	try {
		return await run;
	} finally {
		args.dispatch.writeSettled( kind );
	}
}

/**
 * Whether this is the only write of its kind queued or in flight.
 *
 * Each save response carries its whole slice, so storing one while a later save of its kind waits would undo that save.
 *
 * @param args - Thunk arguments.
 * @param kind - Write kind.
 * @return Whether it is the last.
 */
const isLastWrite = ( args: ThunkArgs, kind: WriteKind ) =>
	args.select.getPendingWrites( kind ) <= 1;

/**
 * Notices dispatcher.
 *
 * @param args - Thunk arguments.
 * @return Bound notices actions.
 */
const notices = ( args: ThunkArgs ) => args.registry.dispatch( noticesStore );

/**
 * Save one setting optimistically, rolling it back if the server refuses.
 *
 * @param key   - Setting.
 * @param value - New value.
 * @return Thunk resolving to the saved settings, or undefined on failure.
 */
export const saveSetting =
	< K extends SettingKey >( key: K, value: Settings[ K ] ) =>
	( args: ThunkArgs ): Promise< Settings | undefined > => {
		const { select, dispatch } = args;
		const previous = select.getSettings()?.[ key ];
		dispatch.receive( 'settings', { ...select.getSettings(), [ key ]: value } );

		return queued( args, 'setting', async () => {
			let saved: Settings | undefined;
			try {
				saved = await api.saveSetting( key, value );
				if ( isLastWrite( args, 'setting' ) ) {
					dispatch.receive( 'settings', saved );
				}
				notices( args ).createSuccessNotice(
					__( 'Settings have been saved', 'jetpack-sharing-likes' ),
					{ type: 'snackbar' }
				);
			} catch ( error ) {
				// A later edit of the same setting replaced this value, and its own save settles it.
				const current = select.getSettings();
				if ( current && current[ key ] === value ) {
					dispatch.receive( 'settings', { ...current, [ key ]: previous } );
				}
				notices( args ).createErrorNotice(
					errorMessage( error, __( 'Your settings could not be saved.', 'jetpack-sharing-likes' ) ),
					{ type: 'snackbar' }
				);
				// A refused save usually means the screen is out of date: another tab, or a host forcing a module.
				// A queued save's response refreshes the settings instead, without racing its optimistic value.
				if ( isLastWrite( args, 'setting' ) ) {
					dispatch.reread( 'settings' );
				}
			}
			// Saving Comment Likes can change which sections configure, and so which settings are offered.
			await dispatch.reread( 'status' );
			return saved;
		} );
	};

/**
 * Whether two pairs of lists hold the same services in the same order.
 *
 * @param a - Lists.
 * @param b - Lists.
 * @return Whether they match.
 */
function sameLists( a: ServiceLists, b: ServiceLists ): boolean {
	return JSON.stringify( [ a.visible, a.hidden ] ) === JSON.stringify( [ b.visible, b.hidden ] );
}

/**
 * Save the enabled services optimistically, rolling back if the server refuses.
 *
 * @param lists           - Both lists, in order.
 * @param options         - Options.
 * @param options.message - Snackbar message.
 * @param options.undo    - What Undo puts back.
 * @return Thunk resolving to the saved services, or undefined on failure.
 */
export const saveServices =
	( lists: ServiceLists, { message, undo }: SaveServicesOptions = {} ) =>
	async ( args: ThunkArgs ): Promise< Services | undefined > => {
		const { select, dispatch } = args;
		// An Undo offered before this change would now revert it.
		notices( args ).removeNotice( SAVED_NOTICE_ID );
		const current = select.getServices();
		const previous = { visible: current?.visible ?? [], hidden: current?.hidden ?? [] };
		if ( current ) {
			dispatch.receive( 'services', { ...current, ...lists } );
		} else {
			dispatch.discardReads( 'services' );
		}

		const restore = () => {
			const latest = select.getServices();
			if ( ! undo || ! latest || [ ...latest.visible, ...latest.hidden ].includes( undo.id ) ) {
				return;
			}
			const ids = [ ...latest[ undo.row ] ];
			ids.splice( Math.min( undo.index, ids.length ), 0, undo.id );
			dispatch.saveServices( {
				visible: latest.visible,
				hidden: latest.hidden,
				[ undo.row ]: ids,
			} );
		};

		let saved: Services;
		try {
			saved = await queued( args, 'services', async () => {
				let refused: unknown;
				let response: Services | undefined;
				try {
					response = await api.saveServices( lists.visible, lists.hidden );
					if ( isLastWrite( args, 'services' ) ) {
						dispatch.receive( 'services', response );
					}
				} catch ( error ) {
					refused = error ?? new Error();
					const latest = select.getServices();
					if ( latest && sameLists( latest, lists ) ) {
						dispatch.receive( 'services', { ...latest, ...previous } );
					}
					notices( args ).createErrorNotice(
						errorMessage(
							error,
							__( 'Your sharing buttons could not be saved.', 'jetpack-sharing-likes' )
						),
						{ type: 'snackbar' }
					);
					if ( isLastWrite( args, 'services' ) ) {
						dispatch.reread( 'services' );
					}
				}
				// A refusal, or an empty list on a block theme, can change which sections configure.
				if ( refused || lists.visible.length + lists.hidden.length === 0 ) {
					await Promise.all( [
						dispatch.reread( 'status' ),
						select.getPendingWrites( 'setting' ) > 0 ? undefined : dispatch.reread( 'settings' ),
					] );
				}
				if ( refused ) {
					throw refused;
				}
				return response as Services;
			} );
		} catch {
			return undefined;
		}

		notices( args ).createSuccessNotice(
			message ?? __( 'Settings have been saved', 'jetpack-sharing-likes' ),
			{
				id: SAVED_NOTICE_ID,
				type: 'snackbar',
				actions: undo
					? [ { label: __( 'Undo', 'jetpack-sharing-likes' ), onClick: restore } ]
					: undefined,
			}
		);
		return saved;
	};

/**
 * A custom-service request in the write queue, with its error snackbar.
 *
 * @param args     - Thunk arguments.
 * @param request  - Request.
 * @param fallback - Message when the error carries none.
 * @return What the request returns; rejects when it fails.
 */
function customServiceWrite< T >( args: ThunkArgs, request: () => Promise< T >, fallback: string ) {
	return queued( args, 'custom-service', async () => {
		try {
			return await request();
		} catch ( error ) {
			notices( args ).createErrorNotice( errorMessage( error, fallback ), { type: 'snackbar' } );
			throw error;
		}
	} );
}

/**
 * Change the cached service list, when there is one.
 *
 * @param args   - Thunk arguments.
 * @param update - New list from the old one.
 */
function updateServiceList( args: ThunkArgs, update: ( list: Service[] ) => Service[] ) {
	const data = args.select.getServices();
	if ( data ) {
		args.dispatch.receive( 'services', { ...data, services: update( data.services ) } );
	}
}

/**
 * The "Settings have been saved" snackbar.
 *
 * @param args - Thunk arguments.
 */
function notifySaved( args: ThunkArgs ) {
	notices( args ).createSuccessNotice( __( 'Settings have been saved', 'jetpack-sharing-likes' ), {
		type: 'snackbar',
	} );
}

const notSaved = () => __( 'The custom service could not be saved.', 'jetpack-sharing-likes' );

/**
 * Create a custom service, then save it at the end of a row.
 *
 * @param fields - Name, sharing URL and icon URL.
 * @param row    - Row to add it to.
 * @return Thunk resolving to whether it went through.
 */
export const createCustomService =
	( fields: CustomServiceFields, row: ServiceRow ) =>
	async ( args: ThunkArgs ): Promise< boolean > => {
		let service: Service;
		try {
			service = await customServiceWrite(
				args,
				() => api.createCustomService( fields ),
				notSaved()
			);
		} catch {
			return false;
		}
		updateServiceList( args, list => [ ...list, service ] );
		// Read now rather than before the request: moves made meanwhile are already in the store.
		const data = args.select.getServices();
		const lists: ServiceLists = { visible: data?.visible ?? [], hidden: data?.hidden ?? [] };
		await args.dispatch.saveServices( { ...lists, [ row ]: [ ...lists[ row ], service.id ] } );
		return true;
	};

/**
 * Change a custom service.
 *
 * @param id     - Service ID.
 * @param fields - Name, sharing URL and icon URL.
 * @return Thunk resolving to whether it went through.
 */
export const updateCustomService =
	( id: string, fields: CustomServiceFields ) =>
	async ( args: ThunkArgs ): Promise< boolean > => {
		try {
			const service = await customServiceWrite(
				args,
				() => api.updateCustomService( id, fields ),
				notSaved()
			);
			updateServiceList( args, list => list.map( item => ( item.id === id ? service : item ) ) );
			notifySaved( args );
			return true;
		} catch {
			return false;
		}
	};

/**
 * Delete a custom service, then save the lists without it.
 *
 * @param id - Service ID.
 * @return Thunk resolving to whether it went through.
 */
export const deleteCustomService =
	( id: string ) =>
	async ( args: ThunkArgs ): Promise< boolean > => {
		try {
			await customServiceWrite(
				args,
				() => api.deleteCustomService( id ),
				__( 'The custom service could not be deleted.', 'jetpack-sharing-likes' )
			);
		} catch {
			return false;
		}
		updateServiceList( args, list => list.filter( item => item.id !== id ) );
		const data = args.select.getServices();
		if ( data && ( data.visible.includes( id ) || data.hidden.includes( id ) ) ) {
			await args.dispatch.saveServices( {
				visible: data.visible.filter( other => other !== id ),
				hidden: data.hidden.filter( other => other !== id ),
			} );
		} else {
			notifySaved( args );
		}
		return true;
	};

/**
 * "Switch to the … block" and "Turn on …".
 *
 * @param feature - Feature.
 * @param action  - Action.
 * @return Thunk resolving once the action and its rereads are done.
 */
export const runFeatureAction =
	( feature: Feature, action: api.FeatureAction ) =>
	( args: ThunkArgs ): Promise< void > =>
		queued( args, 'feature-action', async () => {
			const { select, dispatch } = args;
			let failed = false;
			try {
				dispatch.receive( 'status', await api.runFeatureAction( feature, action ) );
				notifySaved( args );
			} catch ( error ) {
				failed = true;
				notices( args ).createErrorNotice(
					errorMessage(
						error,
						__( 'This action is not available on this site right now.', 'jetpack-sharing-likes' )
					),
					{ type: 'snackbar' }
				);
			}
			const sharing = select.getStatus()?.sharing.state;
			// Which settings are offered follows the section variants; awaited so the next write waits for them.
			await Promise.all( [
				failed ? dispatch.reread( 'status' ) : undefined,
				// A pending save's response brings fresh settings, and this read could land after it.
				select.getPendingWrites( 'setting' ) > 0 ? undefined : dispatch.reread( 'settings' ),
				// Services can only be read while Sharing configures (see `useServices()`); a pending services save brings fresh lists.
				! failed &&
				!! sharing &&
				configures( sharing ) &&
				select.getPendingWrites( 'services' ) === 0
					? dispatch.reread( 'services' )
					: undefined,
			] );
		} );
