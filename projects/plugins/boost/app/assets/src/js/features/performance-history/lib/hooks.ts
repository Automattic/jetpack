import apiFetch from '@wordpress/api-fetch';
import { z } from 'zod';
import { queryClient, useDataSync } from '@automattic/jetpack-react-data-sync-client';

const periodsSchema = z.object( {
	timestamp: z.number(),
	dimensions: z.object( {
		desktop_overall_score: z.number(),
		mobile_overall_score: z.number(),
		desktop_cls: z.number(),
		desktop_lcp: z.number(),
		desktop_tbt: z.number(),
		mobile_cls: z.number(),
		mobile_lcp: z.number(),
		mobile_tbt: z.number(),
	} ),
} );

export const performanceHistoryDataSchema = z
	.object( {
		periods: z.array( periodsSchema ),
		annotations: z.array(
			z.object( {
				timestamp: z.number(),
				text: z.string(),
			} )
		),
		startDate: z.number(),
		endDate: z.number(),
	} )
	.nullable();

export const usePerformanceHistoryQuery = () => {
	const [ query ] = useDataSync(
		'jetpack_boost_ds',
		'performance_history',
		performanceHistoryDataSchema,
		{
			query: {
				staleTime: 12 * 60 * 60 * 1000, // 12 hours
			},
		}
	);

	return query;
};

/**
 * A custom hook to handle performance history panel being open or closed.
 */
export const usePerformanceHistoryPanelQuery = () => {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'performance_history_toggle',
		z.boolean()
	);

	return [ data, mutate ] as const;
};

type AlertIds =
	| 'performance_history_fresh_start'
	| 'score_increase'
	| 'score_decrease'
	| 'legacy_minify_notice';

const dismissedAlertsSchema = z.record( z.string().min( 1 ), z.boolean() );

/**
 * A hook that handles permanent dismissals of alerts.
 *
 * @param {AlertIds} alertId
 * @return {[ boolean, () => void ]} - A tuple with the state and a method to dismiss the alert.
 */
export const useDismissibleAlertState = ( alertId: AlertIds ) => {
	const [ { data: dismissedAlerts }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'dismissed_alerts',
		dismissedAlertsSchema,
		{
			mutation: {
				// Serialize dismissals so a late response cannot overwrite a newer dismissal.
				scope: { id: 'jetpack_boost_dismissed_alerts' },
				onError: ( _error, _variables, context ) => {
					const previous = (
						context as { previousValue?: z.infer< typeof dismissedAlertsSchema > }
					 )?.previousValue?.[ alertId ];
					queryClient.setQueryData< z.infer< typeof dismissedAlertsSchema > >(
						[ 'dismissed_alerts' ],
						current => {
							const restored = { ...current };
							if ( previous === undefined ) {
								delete restored[ alertId ];
							} else {
								restored[ alertId ] = previous;
							}
							return restored;
						}
					);
				},
				mutationFn: async () => {
					const { rest_api, dismissed_alerts } = window.jetpack_boost_ds;
					const response = await apiFetch< { JSON: unknown } >( {
						url: `${ rest_api.value.replace( /\/$/, '' ) }/dismissed-alerts/merge`,
						method: 'POST',
						credentials: 'same-origin',
						headers: {
							'X-WP-Nonce': rest_api.nonce,
							'X-Jetpack-WP-JS-Sync-Nonce': dismissed_alerts.nonce,
						},
						data: { JSON: { [ alertId ]: true } },
					} );
					return dismissedAlertsSchema.parse( response.JSON );
				},
			},
		}
	);
	const dismiss = () => {
		mutate( { ...dismissedAlerts, [ alertId ]: true } );
	};
	const isDismissed = dismissedAlerts?.[ alertId ] === true;

	return [ isDismissed, dismiss ] as const;
};
