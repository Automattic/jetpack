/**
 * Internal dependencies
 */
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
const UsageBar: React.FC< UsageBarProps > = ( { usage } ) => {
	if ( usage == null ) {
		return null;
	}

	const normalizedUsage = Math.max( Math.min( usage, 1 ), 0 );

	const style = {
		width: `${ normalizedUsage * 100 }%`,
	};

	return (
		<div className="ai-assistant-usage-bar-wrapper">
			<div className="ai-assistant-usage-bar-usage" style={ style }></div>
		</div>
	);
};

export default UsageBar;
