/**
 * External dependencies
 */
import { Tooltip } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
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
	const notEnoughRequests = requestsBalance < cost;

	const requestsCountLabel = sprintf(
		// Translators: %1$d is the number of requests used, %d is the limit of requests.
		__( 'Usage: %1$d / %2$d requests', 'jetpack' ),
		currentUsage,
		currentLimit
	);

	const pricingLabel = sprintf(
		// Translators: %d is the cost of generating a featured image.
		__( '%d requests per image', 'jetpack' ),
		cost
	);

	const pricingLabelNotEnoughRequests = sprintf(
		// Translators: %d is the cost of generating a featured image.
		__(
			"%d requests per image. You don't have enough requests to generate another image",
			'jetpack'
		),
		cost
	);

	return (
		<div className="ai-assistant-featured-image__usage-counter">
			{ requestsCountLabel }
			<Tooltip
				text={ notEnoughRequests ? pricingLabelNotEnoughRequests : pricingLabel }
				placement="bottom"
			>
				<Icon className="usage-counter__icon" icon={ info } />
			</Tooltip>
		</div>
	);
}
