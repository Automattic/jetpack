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
import type { UsageBarProps } from './types';
import type React from 'react';

/**
 * UsageBar component
 *
 * @param {UsageBarProps} props - Component props.
 * @returns {React.ReactNode}     UsageBar react component.
 */
const UsageBar: React.FC< UsageBarProps > = ( {
	usage,
	isOverLimit,
	hasFeature,
}: UsageBarProps ): React.ReactNode => {
	if ( usage == null ) {
		return null;
	}

	let help = hasFeature ? __( 'Unlimited requests for your site', 'jetpack' ) : undefined;
	if ( isOverLimit ) {
		help = __( 'You have reached your plan requests limit.', 'jetpack' );
	}

	const normalizedUsage = Math.max( Math.min( usage, 1 ), 0 );

	const style = {
		width: `${ normalizedUsage * 100 }%`,
	};

	return (
		<BaseControl help={ help }>
			<div className="ai-assistant-usage-bar-wrapper">
				<div
					className={ classNames( 'ai-assistant-usage-bar-usage', {
						'is-over-limit': isOverLimit,
					} ) }
					style={ style }
				></div>
			</div>
		</BaseControl>
	);
};

export default UsageBar;
