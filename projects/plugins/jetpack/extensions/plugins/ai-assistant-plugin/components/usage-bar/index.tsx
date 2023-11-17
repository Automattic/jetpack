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
	planType,
	requestsCount,
	requestsLimit,
	daysUntilReset = null,
}: UsageControlProps ) {
	// Trust on the isOverLimit flag, but also do a local check
	const limitReached = isOverLimit || requestsCount >= requestsLimit;

	// The message we may want to show.
	const helpMessages = Array< string >();

	if ( limitReached && planType === 'free' ) {
		helpMessages.push( __( "You've reached your free requests limit.", 'jetpack' ) );
	}

	if ( limitReached && planType === 'tiered' ) {
		helpMessages.push( __( "You've reached your plan requests limit.", 'jetpack' ) );
	}

	if ( daysUntilReset && planType === 'tiered' ) {
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
			{ planType === 'free' && (
				<p>
					{ sprintf(
						// translators: %1$d: current request counter; %2$d: request allowance;
						__( '%1$d / %2$d free requests.', 'jetpack' ),
						requestsCount,
						requestsLimit
					) }
				</p>
			) }
			{ planType === 'tiered' && (
				<p>
					{ sprintf(
						// translators: %1$d: current request counter; %2$d: request allowance;
						__( '%1$d / %2$d requests.', 'jetpack' ),
						requestsCount,
						requestsLimit
					) }
				</p>
			) }
			{ planType === 'unlimited' && <p>{ __( 'Unlimited requests.', 'jetpack' ) }</p> }
			{ ( planType === 'free' || planType === 'tiered' ) && (
				<UsageBar usage={ usage } limitReached={ limitReached } />
			) }
		</BaseControl>
	);
}

export default UsageControl;
