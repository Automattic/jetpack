import { formatNumber } from '@automattic/number-formatters';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import './usage-counter.scss';
import type { ReactElement } from 'react';

type UsageCounterProps = {
	currentLimit: number;
	currentUsage: number;
	cost: number;
};

/**
 * UsageCounter component
 * @param {UsageCounterProps} props - The component properties.
 * @return {ReactElement} - rendered component.
 */
export default function UsageCounter( { currentLimit, currentUsage, cost }: UsageCounterProps ) {
	const requestsBalance = currentLimit - currentUsage;

	const requestsNeeded = createInterpolateElement(
		sprintf(
			// Translators: %s is the formatted cost of one image.
			__( 'Requests needed: <counter>%s</counter>', 'jetpack-ai-client' ),
			formatNumber( cost )
		),
		{
			counter: <span />,
		}
	);
	const requestsAvailable = createInterpolateElement(
		sprintf(
			// Translators: %s is the formatted current requests balance.
			__( 'Requests available: <counter>%s</counter>', 'jetpack-ai-client' ),
			formatNumber( requestsBalance )
		),
		{
			counter:
				requestsBalance < cost ? (
					<span className="ai-assistant-featured-image__usage-counter-no-limit" />
				) : (
					<strong />
				),
		}
	);

	return (
		<div className="ai-assistant-featured-image__usage-counter">
			<span>{ requestsNeeded }</span>
			<span>{ requestsAvailable }</span>
		</div>
	);
}
