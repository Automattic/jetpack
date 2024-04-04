/**
 * External dependencies
 */
import { Tooltip } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import './usage-counter.scss';

export default function UsageCounter() {
	const featureData = useAiFeature();

	const currentLimit = featureData?.currentTier?.value || 0;
	const currentUsage = featureData?.usagePeriod?.requestsCount || 0;
	const featuredImageCost = featureData?.costs?.[ 'featured-post-image' ]?.image;
	const isUnlimited = currentLimit === 1;

	const loadingLabel = __( '…', 'jetpack' );
	const requestsCountLabel = sprintf(
		// Translators: %1$d is the number of requests used, %d is the limit of requests.
		__( 'Usage: %1$d / %2$d requests', 'jetpack' ),
		currentUsage,
		currentLimit
	);

	const pricingLabel = sprintf(
		// Translators: %d is the cost of generating a featured image.
		__( 'Featured image generation costs %d requests per image', 'jetpack' ),
		featuredImageCost
	);

	// No usage counter if the plan is unlimited.
	if ( isUnlimited ) {
		return null;
	}

	return (
		<div className="ai-assistant-featured-image__usage-counter">
			{ featureData?.loading ? loadingLabel : requestsCountLabel }
			<Tooltip text={ pricingLabel } placement="bottom">
				<Icon className="usage-counter__icon" icon={ info } />
			</Tooltip>
		</div>
	);
}
