/**
 * Internal dependencies
 */
import { BaseControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
/**
 * Types
 */
import type { UsageBarProps } from './types';
import type { AIFeatureProps } from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import type React from 'react';

import './style.scss';

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
	usagePeriod,
}: Pick<
	AIFeatureProps,
	'isOverLimit' | 'hasFeature' | 'requestsCount' | 'requestsLimit' | 'usagePeriod'
> ) {
	// Compute the number of days from now to the next period
	let resetMsg = '';
	if ( usagePeriod?.nextStart ) {
		const nextPeriodStart = new Date( usagePeriod.nextStart );

		// Number of days until the next period
		const numberOfDays = Math.ceil(
			( nextPeriodStart.getTime() - Date.now() ) / ( 1000 * 60 * 60 * 24 )
		);

		// translators: %1$d: number of days
		resetMsg = sprintf( __( 'Requests will reset in %1$d days.', 'jetpack' ), numberOfDays );
	}

	let help = __( 'Unlimited requests for your site.', 'jetpack' );

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

	const helpComponent = (
		<>
			{ help }
			<br />
			{ hasFeature ? resetMsg : null }
		</>
	);

	return (
		<BaseControl help={ helpComponent } label={ __( 'Usage', 'jetpack' ) }>
			<p>{ hasFeature ? unlimitedPlanUsageMessage : freeUsageMessage }</p>
			{ ! hasFeature && <UsageBar usage={ usage } limitReached={ limitReached } /> }
		</BaseControl>
	);
}

export default UsageControl;
