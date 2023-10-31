/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export type AiAssistantTier = {
	slug: string;
	limit: number;
	readableLimit?: string;
};

const TIER_AI_FREE: AiAssistantTier = {
	slug: 'ai-assistant-tier-free',
	limit: 20,
};

const TIER_AI_MONTHLY_100: AiAssistantTier = {
	slug: 'ai-assistant-tier-100',
	limit: 100,
};

const TIER_AI_MONTHLY_200: AiAssistantTier = {
	slug: 'ai-assistant-tier-200',
	limit: 200,
};

const TIER_AI_MONTHLY_500: AiAssistantTier = {
	slug: 'ai-assistant-tier-500',
	limit: 500,
};

const TIER_AI_UNLIMITED: AiAssistantTier = {
	slug: 'ai-assistant-tier-unlimited',
	limit: Infinity,
	readableLimit: __( 'unlimited', 'jetpack' ),
};

const TIERS = [
	TIER_AI_FREE,
	TIER_AI_MONTHLY_100,
	TIER_AI_MONTHLY_200,
	TIER_AI_MONTHLY_500,
	TIER_AI_UNLIMITED,
];

/**
 * Function getNextTierByUsage
 * Given a current usage, returns the next TIER whose limit is higher than the current usage.
 *
 * @param {number} usage - The current usage.
 * @returns {AiAssistantTier} The next AiAssistantTier whose limit is higher than the current usage.
 */
export function getNextTierByUsage( usage: number ): AiAssistantTier {
	return TIERS.find( tier => tier.limit > usage );
}
