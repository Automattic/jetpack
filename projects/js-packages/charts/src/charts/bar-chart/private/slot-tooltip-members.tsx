import { TooltipContext } from '@visx/xychart';
import { useContext, useEffect } from 'react';
import type { DataPointDate } from '../../../types';

/** A bar at the keyboard-selected category. */
export type SlotMember = { key: string; datum: DataPointDate | undefined };

/**
 * Adds every bar of the keyboard-selected category to the tooltip, which the keyboard otherwise fills with the selected slot's stop alone.
 *
 * Render it before `XYChartTooltip`: effects run in tree order, so the stop that tooltip shows next stays the nearest datum.
 *
 * @param props         - Component props.
 * @param props.members - The category's bars.
 * @param props.index   - The selected data point.
 * @return No visual content.
 */
export function SlotTooltipMembers( { members, index }: { members: SlotMember[]; index: number } ) {
	const { showTooltip } = useContext( TooltipContext ) ?? {};

	useEffect( () => {
		members.forEach( ( { key, datum } ) => {
			if ( datum ) {
				showTooltip?.( { key, datum, index } );
			}
		} );
		// `showTooltip` is stable; the context object is not.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ members, index ] );

	return null;
}
