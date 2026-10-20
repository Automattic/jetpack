import { __ } from '@wordpress/i18n';
import { Badge, Stack } from '@wordpress/ui';
import { getResolvedPlans } from '../../lib/subscription-plans';
import type { Subscriber } from '../../data/types';
import type { JSX } from 'react';

type Props = {
	subscriber: Subscriber;
};

/**
 * Subscription type cell — each paid plan renders as a stable-intent `Badge` named after the plan,
 * and each complimentary subscription as an informational badge named after the comped plan
 * ("Comp: Gold"); a reader with neither gets a neutral "Free" badge.
 *
 * @param props            - Component props.
 * @param props.subscriber - Subscriber row.
 * @return Subscription-type cell content.
 */
export default function SubscriptionTypeCell( { subscriber }: Props ): JSX.Element {
	const plans = getResolvedPlans( subscriber ).filter( plan => ! plan.is_free );

	if ( plans.length === 0 ) {
		return <Badge intent="none">{ __( 'Free', 'jetpack-newsletter' ) }</Badge>;
	}

	return (
		<Stack direction="row" gap="xs" wrap="wrap">
			{ plans.map( ( plan, index ) => (
				<Badge
					key={ `${ plan.plan }-${ index }` }
					intent={ plan.is_complimentary ? 'informational' : 'stable' }
				>
					{ plan.plan }
				</Badge>
			) ) }
		</Stack>
	);
}
