/**
 * Types
 */
import { AIFeatureProps } from '../../../../blocks/ai-assistant/hooks/use-ai-feature';

export type UsageBarProps = {
	/**
	 * The current usage, as a percentage represented by a number between 0 and 1.
	 */
	usage: number;

	/**
	 * True if the usage is over the limit.
	 */
	limitReached: boolean;
};
export type UsageControlProps = Pick<
	AIFeatureProps,
	'isOverLimit' | 'hasFeature' | 'requestsCount' | 'requestsLimit'
>;
