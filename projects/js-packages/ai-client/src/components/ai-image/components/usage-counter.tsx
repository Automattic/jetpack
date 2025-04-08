/**
 * External dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './usage-counter.scss';

type UsageCounterProps = {
	currentLimit: number;
	currentUsage: number;
	cost: number;
};

/**
 * UsageCounter component
 * @param {UsageCounterProps} props - The component properties.
 * @return {React.ReactElement} - rendered component.
 */
export default function UsageCounter( { currentLimit, currentUsage, cost }: UsageCounterProps ) {
	const requestsBalance = currentLimit - currentUsage;

	const requestsNeeded = createInterpolateElement(
		// Translators: %d is the cost of one image.
		sprintf( __( 'Requests needed: <counter>%d</counter>', 'jetpack-ai-client' ), cost ),
		{
			counter: <span />,
		}
	);
	const requestsAvailable = createInterpolateElement(
		sprintf(
			// Translators: %d is the current requests balance.
			__( 'Requests available: <counter>%d</counter>', 'jetpack-ai-client' ),
			requestsBalance
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
