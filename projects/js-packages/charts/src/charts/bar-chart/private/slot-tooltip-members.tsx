import { TooltipContext } from '@visx/xychart';
import { useContext, useEffect } from 'react';
import type { DataPointDate } from '../../../types';

/** A bar at the keyboard-selected category. */
export type SlotMember = { key: string; datum: DataPointDate };

/**
 * Fills the tooltip with every bar of the keyboard-selected category, and only those.
 *
 * The last member shown becomes the tooltip's nearest datum, so the caller lists the keyboard stop last.
 *
 * @param props         - Component props.
 * @param props.members - The category's bars, the keyboard stop last.
 * @param props.index   - The selected data point.
 * @return No visual content.
 */
export function SlotTooltipMembers( { members, index }: { members: SlotMember[]; index: number } ) {
	const { showTooltip, updateTooltip } = useContext( TooltipContext ) ?? {};

	useEffect( () => {
		updateTooltip?.( state => ( { ...state, tooltipData: undefined } ) );
		members.forEach( ( { key, datum } ) => showTooltip?.( { key, datum, index } ) );
		// `showTooltip` and `updateTooltip` are stable; the context object is not.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ members, index ] );

	return null;
}
