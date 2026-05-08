import { __ } from '@wordpress/i18n';
import { Badge, Stack } from '@wordpress/ui';
import { getResolvedPlans } from '../../lib/subscription-plans';
import type { Subscriber } from '../../data/types';

type Props = {
	subscriber: Subscriber;
};

/**
 * Subscription type cell — paid plans render as stable-intent `Badge`s named after the plan;
 * complimentary subscriptions render as an informational badge ("Comp"); a free reader gets a
 * neutral badge. Mirrors Calypso's `SubscriptionTypeCell`.
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
			<Stack direction="row" gap="xs" wrap="wrap">
				{ paidPlans.map( ( plan, index ) => (
					<Badge key={ `${ plan.plan }-${ index }` } intent="stable">
						{ plan.plan }
					</Badge>
				) ) }
			</Stack>
		);
	}

	const hasComp = plans.some( plan => plan.is_complimentary );
	if ( hasComp ) {
		return <Badge intent="informational">{ __( 'Comp', 'jetpack-newsletter' ) }</Badge>;
	}

	return <Badge intent="none">{ __( 'Free', 'jetpack-newsletter' ) }</Badge>;
}
