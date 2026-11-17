import { TooltipContext } from '@visx/xychart';
import { useContext, useEffect } from 'react';
import type { DataPointDate } from '../../../types';

/** A bar at the keyboard-selected category. */
export type SlotMember = { key: string; datum: DataPointDate; index: number };

/**
 * Fills the tooltip with every bar of the keyboard-selected category, and only those.
 *
 * The last member shown becomes the tooltip's nearest datum, so the caller lists the keyboard stop last.
 *
 * @param props         - Component props.
 * @param props.members - The category's bars, the keyboard stop last.
 * @return No visual content.
 */
export function SlotTooltipMembers( { members }: { members: SlotMember[] } ) {
	const { showTooltip, updateTooltip } = useContext( TooltipContext ) ?? {};

	useEffect( () => {
		updateTooltip?.( state => ( { ...state, tooltipData: undefined } ) );
		members.forEach( member => showTooltip?.( member ) );
		// `showTooltip` and `updateTooltip` are stable; the context object is not.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ members ] );

	return null;
}
