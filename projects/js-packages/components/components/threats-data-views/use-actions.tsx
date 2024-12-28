import { getFixerAction, Threat } from '@automattic/jetpack-scan';
import { Action } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useContext, useMemo } from 'react';
import { THREAT_ACTION_FIX, THREAT_ACTION_IGNORE, THREAT_ACTION_UNIGNORE } from './constants';
import { ThreatsDataViewsContext } from './context';

/**
 * DataView Actions Hook.
 *
 * @return {object} The DataView actions.
 */
export default function useActions(): { actions: Action< Threat >[] } {
	const { actionCallbacks, view } = useContext( ThreatsDataViewsContext );
	/**
	 * DataView actions - collection of operations that can be performed upon each record.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#actions-object
	 */
	const actions: Action< Threat >[] = useMemo( () => {
		return [
			{
				id: THREAT_ACTION_FIX,
				label: items => {
					return getFixerAction( items[ 0 ] );
				},
				isPrimary: true,
				callback: actionCallbacks[ THREAT_ACTION_FIX ]?.callback,
				isEligible( item ) {
					if ( view.type !== 'list' ) {
						return false;
					}
					if ( ! actionCallbacks[ THREAT_ACTION_FIX ] ) {
						return false;
					}
					if ( actionCallbacks[ THREAT_ACTION_FIX ].isEligible ) {
						return actionCallbacks[ THREAT_ACTION_FIX ].isEligible( item );
					}
					return !! item.fixable;
				},
			},
			{
				id: THREAT_ACTION_IGNORE,
				label: __( 'Ignore', 'jetpack-components' ),
				isPrimary: true,
				isDestructive: true,
				callback: actionCallbacks[ THREAT_ACTION_IGNORE ]?.callback,
				isEligible( item ) {
					if ( ! actionCallbacks[ THREAT_ACTION_IGNORE ] ) {
						return false;
					}
					if ( actionCallbacks[ THREAT_ACTION_IGNORE ].isEligible ) {
						return actionCallbacks[ THREAT_ACTION_IGNORE ].isEligible( item );
					}
					return item.status === 'current';
				},
			},
			{
				id: THREAT_ACTION_UNIGNORE,
				label: __( 'Unignore', 'jetpack-components' ),
				isPrimary: true,
				isDestructive: true,
				callback: actionCallbacks[ THREAT_ACTION_UNIGNORE ]?.callback,
				isEligible( item ) {
					if ( ! actionCallbacks[ THREAT_ACTION_UNIGNORE ] ) {
						return false;
					}
					if ( actionCallbacks[ THREAT_ACTION_UNIGNORE ].isEligible ) {
						return actionCallbacks[ THREAT_ACTION_UNIGNORE ].isEligible( item );
					}
					return item.status === 'ignored';
				},
			},
		];
	}, [ view.type, actionCallbacks ] );

	return {
		actions,
	};
}
