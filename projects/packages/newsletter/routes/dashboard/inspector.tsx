import { QueryClientProvider } from '@tanstack/react-query';
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close as closeIcon } from '@wordpress/icons';
import { useNavigate, useSearch } from '@wordpress/route';
import { Stack } from '@wordpress/ui';
import SubscriberDetailContent from '../../_inc/subscribers/components/detail/subscriber-detail-content';
import { queryClient } from '../../_inc/subscribers/lib/query-client';

type SubscribersSearch = Record< string, unknown > & {
	subscriber?: string | number;
	u?: string | number;
};

/**
 * Coerce a URL search-param value into a positive finite number.
 *
 * @param value - Raw search-param value (string, number, undefined).
 * @return Positive finite number, or undefined when the input is empty/invalid.
 */
function toFiniteNumber( value: unknown ): number | undefined {
	if ( value === undefined || value === null || value === '' ) {
		return undefined;
	}
	const num = Number( value );
	return Number.isFinite( num ) && num > 0 ? num : undefined;
}

/**
 * Inspector body — reads the selected subscriber from URL search params and
 * renders the detail content. `route.inspector` gates whether this is mounted.
 *
 * @return Inspector content, or null while no subscriber is selected.
 */
function InspectorInner(): JSX.Element | null {
	const navigate = useNavigate();
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as SubscribersSearch;

	const subscriptionId = toFiniteNumber( search?.subscriber );
	const userId = toFiniteNumber( search?.u );

	const onClose = useCallback( () => {
		navigate( {
			search: {
				...search,
				subscriber: undefined,
				u: undefined,
			},
		} as unknown as Parameters< typeof navigate >[ 0 ] );
	}, [ navigate, search ] );

	if ( ! subscriptionId && ! userId ) {
		return null;
	}

	return (
		<>
			<Stack
				direction="row"
				align="center"
				justify="end"
				gap="xs"
				wrap="wrap"
				className="jetpack-newsletter__panel-header"
			>
				<Button
					accessibleWhenDisabled
					iconSize={ 20 }
					icon={ closeIcon }
					label={ __( 'Close', 'jetpack-newsletter' ) }
					showTooltip
					size="compact"
					onClick={ onClose }
				/>
			</Stack>
			<div className="jetpack-newsletter__panel-body">
				<SubscriberDetailContent open={ { subscriptionId, userId } } />
			</div>
		</>
	);
}

/**
 * Boot's inspector slot wrapper — provides the shared React Query client so
 * detail queries hit the same cache the stage warmed up.
 *
 * @return Inspector tree wrapped in a QueryClientProvider.
 */
function Inspector(): JSX.Element {
	return (
		<QueryClientProvider client={ queryClient }>
			<InspectorInner />
		</QueryClientProvider>
	);
}

export { Inspector as inspector };
