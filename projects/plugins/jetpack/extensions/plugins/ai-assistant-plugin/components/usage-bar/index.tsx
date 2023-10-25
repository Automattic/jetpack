/**
 * Internal dependencies
 */
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
					'is-over-limit': isOverLimit,
				} ) }
				style={ style }
			></div>
		</div>
	);
};

export default UsageBar;
