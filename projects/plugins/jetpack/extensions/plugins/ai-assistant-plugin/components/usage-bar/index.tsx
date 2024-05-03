/**
 * External dependencies
 */
import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { BaseControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
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
export const UsageBar = ( { usage }: UsageBarProps ): React.JSX.Element => {
	if ( usage == null ) {
		return null;
	}

	const normalizedUsage = Math.max( Math.min( usage, 1 ), 0 );
	const used = normalizedUsage * 100;
	const missing = 100 - used;

	const style = {
		width: `${ missing }%`,
	};

	return (
		<div className="ai-assistant-usage-bar-wrapper">
			<div
				className={ classNames( 'ai-assistant-usage-bar-usage', {
					warning: missing < 60 && missing > 20,
					danger: missing <= 20,
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
	nextResetDate = null,
	loading = false,
}: UsageControlProps ) {
	// Trust on the isOverLimit flag, but also do a local check
	const limitReached = isOverLimit || requestsCount >= requestsLimit;

	// Days until the next reset message
	let daysUntilResetMessage = null;

	// The message we may want to show.
	const helpMessages = Array< string >();

	// Available requests (avoid negative values)
	const availableRequests = Math.max( 0, requestsLimit - requestsCount );

	if ( limitReached && planType === PLAN_TYPE_FREE ) {
		helpMessages.push( __( "You've reached your free requests limit.", 'jetpack' ) );
	}

	if ( limitReached && planType === PLAN_TYPE_TIERED ) {
		helpMessages.push( __( "You've reached your plan requests limit.", 'jetpack' ) );
	}

	if ( nextResetDate && planType === PLAN_TYPE_TIERED ) {
		daysUntilResetMessage = createInterpolateElement(
			sprintf(
				// translators: %1$d: number of days until the next usage count reset
				__( 'Requests will reset to <strong>%1$d</strong> on %2$s.', 'jetpack' ),
				requestsLimit,
				nextResetDate
			),
			{
				strong: <strong />,
			}
		);
	}

	const usage = requestsCount / requestsLimit;

	const usageDisplay = (
		<>
			{ planType === PLAN_TYPE_UNLIMITED && <p>{ __( 'Unlimited requests.', 'jetpack' ) }</p> }
			{ ( planType === PLAN_TYPE_FREE || planType === PLAN_TYPE_TIERED ) && (
				<>
					<p className="jetpack-ai-usage-panel__available-requests">{ availableRequests }</p>
					<UsageBar usage={ usage } />
				</>
			) }
		</>
	);

	const loadingPlaceholder = (
		<LoadingPlaceholder height={ 100 } className="jetpack-ai-usage-panel__loading-placeholder" />
	);

	const help = (
		<>
			{ ! loading && helpMessages.length ? helpMessages.join( ' ' ).concat( ' ' ) : null }
			{ ! loading && daysUntilResetMessage }
		</>
	);

	return (
		<BaseControl help={ help } label={ __( 'Available Requests', 'jetpack' ) }>
			{ ! loading && usageDisplay }
			{ loading && loadingPlaceholder }
		</BaseControl>
	);
}

export default UsageControl;
