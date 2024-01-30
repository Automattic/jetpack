/**
 * External dependencies
 */
import { BaseControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import React from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import {
	PLAN_TYPE_FREE,
	PLAN_TYPE_TIERED,
	PLAN_TYPE_UNLIMITED,
} from '../../../../shared/use-plan-type';
/**
 * Types
 */
import type { UsageBarProps, UsageControlProps } from './types';

/**
 * UsageBar component
 *
 * @param {UsageBarProps} props - Component props.
 * @returns {React.ReactNode}     UsageBar react component.
 */
export const UsageBar: React.FC< UsageBarProps > = ( {
	usage,
	limitReached,
	requireUpgrade = false,
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
					'require-upgrade': requireUpgrade,
				} ) }
				style={ style }
			></div>
		</div>
	);
};

function UsageControl( {
	isOverLimit,
	planType,
	requestsCount,
	requestsLimit,
	daysUntilReset = null,
	requireUpgrade = false,
}: UsageControlProps ) {
	// Trust on the isOverLimit flag, but also do a local check
	const limitReached = isOverLimit || requestsCount >= requestsLimit;

	// The message we may want to show.
	const helpMessages = Array< string >();

	if ( limitReached && planType === PLAN_TYPE_FREE ) {
		helpMessages.push( __( "You've reached your free requests limit.", 'jetpack' ) );
	}

	if ( limitReached && planType === PLAN_TYPE_TIERED ) {
		helpMessages.push( __( "You've reached your plan requests limit.", 'jetpack' ) );
	}

	if ( daysUntilReset && planType === PLAN_TYPE_TIERED ) {
		const daysUntilResetMessage = sprintf(
			// translators: %1$d: number of days until the next usage count reset
			__( 'Requests will reset in %1$d days.', 'jetpack' ),
			daysUntilReset
		);
		helpMessages.push( daysUntilResetMessage );
	}

	const usage = requestsCount / requestsLimit;

	return (
		<BaseControl
			help={ helpMessages.length ? helpMessages.join( ' ' ) : null }
			label={ __( 'Usage', 'jetpack' ) }
		>
			{ planType === PLAN_TYPE_FREE && (
				<p>
					{ sprintf(
						// translators: %1$d: current request counter; %2$d: request allowance;
						__( '%1$d / %2$d free requests.', 'jetpack' ),
						requestsCount,
						requestsLimit
					) }
				</p>
			) }
			{ planType === PLAN_TYPE_TIERED && (
				<p>
					{ sprintf(
						// translators: %1$d: current request counter; %2$d: request allowance;
						__( '%1$d / %2$d requests.', 'jetpack' ),
						requestsCount,
						requestsLimit
					) }
				</p>
			) }
			{ planType === PLAN_TYPE_UNLIMITED && <p>{ __( 'Unlimited requests.', 'jetpack' ) }</p> }
			{ ( planType === PLAN_TYPE_FREE || planType === PLAN_TYPE_TIERED ) && (
				<UsageBar usage={ usage } limitReached={ limitReached } requireUpgrade={ requireUpgrade } />
			) }
		</BaseControl>
	);
}

export default UsageControl;
