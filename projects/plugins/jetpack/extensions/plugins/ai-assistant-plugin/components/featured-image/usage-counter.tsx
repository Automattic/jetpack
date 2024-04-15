/**
 * External dependencies
 */
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

export default function UsageCounter( { currentLimit, currentUsage, cost }: UsageCounterProps ) {
	const requestsBalance = currentLimit - currentUsage;

	const requestsBalanceLabel = __( 'Requests needed / available:', 'jetpack' );

	const requestsBalanceValues = sprintf(
		// Translators: %1$d is the cost of one image, %2$d is the current requests balance.
		__( '%1$d / %2$d', 'jetpack' ),
		cost,
		requestsBalance
	);

	return (
		<div className="ai-assistant-featured-image__usage-counter">
			{ requestsBalanceLabel } <br />
			{ requestsBalanceValues }
		</div>
	);
}
