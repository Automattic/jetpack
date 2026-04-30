import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { getResolvedPlans } from '../../lib/subscription-plans';
import type { Subscriber } from '../../data/types';

type Props = {
	subscriber: Subscriber;
};

/**
 * Subscription type cell — paid plans list paid plans by name; otherwise shows "Comp" when any
 * complimentary plan is present, falling back to "Free". Mirrors Calypso's `SubscriptionTypeCell`.
 *
 * @param props            - Component props.
 * @param props.subscriber - Subscriber row.
 * @return Subscription-type cell content.
 */
export default function SubscriptionTypeCell( { subscriber }: Props ): JSX.Element {
	const plans = getResolvedPlans( subscriber );

	const paidPlans = plans.filter( plan => ! plan.is_complimentary && ! plan.is_free );
	if ( paidPlans.length > 0 ) {
		return (
			<Stack direction="column" gap="xs">
				{ paidPlans.map( ( plan, index ) => (
					<span key={ `${ plan.plan }-${ index }` }>{ plan.plan }</span>
				) ) }
			</Stack>
		);
	}

	const hasComp = plans.some( plan => plan.is_complimentary );
	if ( hasComp ) {
		return <span>{ __( 'Comp', 'jetpack-subscribers-dashboard' ) }</span>;
	}

	return <span>{ __( 'Free', 'jetpack-subscribers-dashboard' ) }</span>;
}
