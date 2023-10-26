/**
 * Internal dependencies
 */
import { BaseControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import './style.scss';
/**
 * Types
 */
import type { UsageBarProps, UsageControlProps } from './types';
import type React from 'react';

/**
 * UsageBar component
 *
 * @param {UsageBarProps} props - Component props.
 * @returns {React.ReactNode}     UsageBar react component.
 */
const UsageBar: React.FC< UsageBarProps > = ( {
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

export function UsageControl( { usage, isOverLimit, hasFeature }: UsageControlProps ) {
	let help = hasFeature ? __( 'Unlimited requests for your site', 'jetpack' ) : undefined;
	const limitReached = isOverLimit && ! hasFeature;
	if ( limitReached ) {
		help = __( 'You have reached your plan requests limit.', 'jetpack' );
	}

	return (
		<BaseControl help={ help } label={ __( 'Usage', 'jetpack' ) }>
			<UsageBar usage={ usage } limitReached={ limitReached } />
		</BaseControl>
	);
}

export default UsageBar;
