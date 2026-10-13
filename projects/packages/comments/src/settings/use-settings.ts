import { useDispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { fetchSettings, saveSettings } from './api';
import type { Settings } from './types';

export type SaveSettings = ( updates: Partial< Settings > ) => Promise< boolean >;

/**
 * The screen's settings, saved optimistically and rolled back if the server refuses.
 *
 * @param initial - Settings from the script data.
 * @return The settings and a save function resolving to whether it saved.
 */
export function useSettings( initial: Settings ): [ Settings, SaveSettings ] {
	const [ settings, setSettings ] = useState( initial );
	const latest = useRef( initial );
	// Saves go out one at a time, so they reach the server in the order they were made.
	const queue = useRef< Promise< unknown > >( Promise.resolve() );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const update = useCallback( ( next: ( current: Settings ) => Settings ) => {
		latest.current = next( latest.current );
		setSettings( latest.current );
	}, [] );

	const save = useCallback< SaveSettings >(
		updates => {
			const previous = Object.fromEntries(
				Object.keys( updates ).map( key => [ key, latest.current[ key as keyof Settings ] ] )
			) as Partial< Settings >;
			update( current => ( { ...current, ...updates } ) );

			const request = queue.current.then( () => saveSettings( updates ) );
			queue.current = request.catch( () => undefined );

			return request.then(
				() => {
					createSuccessNotice( __( 'Settings saved.', 'jetpack-comments' ), { type: 'snackbar' } );
					return true;
				},
				( error: { message?: string } ) => {
					createErrorNotice(
						error?.message || __( 'Your settings could not be saved.', 'jetpack-comments' ),
						{ type: 'snackbar', explicitDismiss: true }
					);

					// The route refuses the whole request when only some keys saved, so ask what stuck.
					// A later edit of the same setting replaced this value, and its own save settles it.
					const settle = ( truth: Partial< Settings > ) =>
						update( current => {
							const next = { ...current };
							for ( const key of Object.keys( updates ) as ( keyof Settings )[] ) {
								if ( current[ key ] === updates[ key ] && key in truth ) {
									( next as Record< string, unknown > )[ key ] = truth[ key ];
								}
							}
							return next;
						} );

					return fetchSettings()
						.then( settle, () => settle( previous ) )
						.then( () => false );
				}
			);
		},
		[ createErrorNotice, createSuccessNotice, update ]
	);

	return [ settings, save ];
}
