/**
 * Internal dependencies
 */
import { BaseControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import './style.scss';
/**
 * Types
 */
import type { UsageBarProps } from './types';
import type { AIFeatureProps } from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import type React from 'react';

/**
 * UsageBar component
 *
 * @param {UsageBarProps} props - Component props.
 * @returns {React.ReactNode}     UsageBar react component.
 */
export const UsageBar: React.FC< UsageBarProps > = ( {
	usage,
	limitReached,
}: UsageBarProps ): React.ReactNode => {
	if ( usage == null ) {
		return null;
	}

	const normalizedUsage = Math.max( Math.min( usage, 1 ), 0 );

	const style = {
		width: `${ normalizedUsage * 100 }%`,
	};

	return (
		<div className="ai-assistant-usage-bar-wrapper">
			<div
				className={ classNames( 'ai-assistant-usage-bar-usage', {
					'is-limit-reached': limitReached,
				} ) }
				style={ style }
			></div>
		</div>
	);
};

function UsageControl( {
	isOverLimit,
	hasFeature,
	requestsCount,
	requestsLimit,
}: Pick< AIFeatureProps, 'isOverLimit' | 'hasFeature' | 'requestsCount' | 'requestsLimit' > ) {
	let help = __( 'Unlimited requests for your site', 'jetpack' );

	if ( ! hasFeature ) {
		// translators: %1$d: number of requests allowed in the free plan
		help = sprintf( __( '%1$d free requests for your site', 'jetpack' ), requestsLimit );
	}

	const limitReached = isOverLimit && ! hasFeature;
	if ( limitReached ) {
		help = __( 'You have reached your plan requests limit.', 'jetpack' );
	}

	// build messages
	const freeUsageMessage = sprintf(
		// translators: %1$d: current request counter; %2$d: request allowance;
		__( '%1$d / %2$d free requests.', 'jetpack' ),
		requestsCount,
		requestsLimit
	);
	const unlimitedPlanUsageMessage = sprintf(
		// translators: placeholder is the current request counter;
		__( '%d / ∞ requests.', 'jetpack' ),
		requestsCount
	);

	const usage = requestsCount / requestsLimit;

	return (
		<BaseControl help={ help } label={ __( 'Usage', 'jetpack' ) }>
			<p>{ hasFeature ? unlimitedPlanUsageMessage : freeUsageMessage }</p>
			{ ! hasFeature && <UsageBar usage={ usage } limitReached={ limitReached } /> }
		</BaseControl>
	);
}

export default UsageControl;
