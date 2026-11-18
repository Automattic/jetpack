/**
 * External dependencies
 */
import { Skeleton, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { performanceSentence } from './detail-header';
import placeholders from './detail-header.module.scss';
import type { EntitySummary, SingleReportHeaderSlots } from './pages/adapter';
import type { DateRange } from '@jetpack-premium-analytics/datetime';
import type { ReactNode } from 'react';

/**
 * What a header states once its summary settles.
 */
export type DetailHeaderParts = {
	visual?: ReactNode;

	/*
	 * The title the page states.
	 */
	title: string;

	/*
	 * The identity line, such as "Page published on Aug 19, 2025."; the window follows it.
	 */
	sentence?: string;

	/*
	 * The committed report range, stated as the performance window.
	 */
	performanceRange?: DateRange;

	/*
	 * The title of a missing or failed entity; absent, `title`.
	 */
	failedTitle?: string;
};

/**
 * The header slots for a summary in any state: placeholders while it resolves, a bare title
 * once it failed or went missing, the identity line and the window otherwise.
 *
 * @param state - The summary's state.
 * @param parts - What the header states.
 * @return The header slots.
 */
export function detailHeaderSlots(
	state: Pick< EntitySummary, 'isLoading' | 'isError' | 'isNotFound' >,
	parts: DetailHeaderParts
): SingleReportHeaderSlots {
	const { visual, title, sentence, performanceRange, failedTitle } = parts;

	// The title lands on its own request, so the header would otherwise read as
	// blank until well after the grid has drawn (WOOA7S-2059).
	if ( state.isLoading ) {
		return {
			visual,
			busy: true,
			title: (
				<>
					<VisuallyHidden>{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
					<Skeleton className={ placeholders.titlePlaceholder } />
				</>
			),
			subTitle: <Skeleton className={ placeholders.subTitlePlaceholder } />,
		};
	}

	// A failed or missing entity has no title or window to state.
	if ( state.isError || state.isNotFound ) {
		return { visual, title: failedTitle ?? title };
	}

	const subTitle = [ sentence, performanceSentence( performanceRange ) ]
		.filter( Boolean )
		.join( ' ' );

	return { visual, title, subTitle: subTitle || undefined };
}
