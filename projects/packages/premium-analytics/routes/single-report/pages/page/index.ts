/**
 * External dependencies
 */
import { getPostTypeCopy } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { entityAdapter } from '../entity';
import { entityHeaderSlots } from '../entity/entity-header-slots';
import type { SingleReportAdapter } from '../adapter';
import type { EntityRecordSummary } from '../entity/use-entity-summary';

/**
 * The page report: the entity adapter, worded for a page where the record has nothing to state.
 */
export const pageAdapter: SingleReportAdapter< EntityRecordSummary > = {
	...entityAdapter,
	untitledTitle: () => getPostTypeCopy( 'page' ).untitled,
	headerSlots: ( summary, context ) =>
		entityHeaderSlots(
			summary,
			context,
			summary.isNotFound
				? __( 'Page not found', 'jetpack-premium-analytics-pkg' )
				: getPostTypeCopy( 'page' ).unavailable
		),
	notFoundDescription: () => __( "We couldn't find this page.", 'jetpack-premium-analytics-pkg' ),
};
