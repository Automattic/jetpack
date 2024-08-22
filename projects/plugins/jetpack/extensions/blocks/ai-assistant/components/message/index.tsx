/**
 * External dependencies
 */
import {
	Icon,
	warning,
	info,
	cancelCircleFilled as error,
	check as success,
} from '@wordpress/icons';
/**
 * Types
 */
import type React from 'react';

import './style.scss';

export const MESSAGE_SEVERITY_WARNING = 'warning';
export const MESSAGE_SEVERITY_ERROR = 'error';
export const MESSAGE_SEVERITY_SUCCESS = 'success';
export const MESSAGE_SEVERITY_INFO = 'info';

const messageSeverityTypes = [
	MESSAGE_SEVERITY_WARNING,
	MESSAGE_SEVERITY_ERROR,
	MESSAGE_SEVERITY_SUCCESS,
	MESSAGE_SEVERITY_INFO,
] as const;

export type MessageSeverityProp = ( typeof messageSeverityTypes )[ number ] | null;

export type MessageProps = {
	icon?: React.ReactNode;
	children: React.ReactNode;
	severity: MessageSeverityProp;
};

const messageIconsMap = {
	[ MESSAGE_SEVERITY_WARNING ]: warning,
	[ MESSAGE_SEVERITY_ERROR ]: error,
	[ MESSAGE_SEVERITY_SUCCESS ]: success,
	[ MESSAGE_SEVERITY_INFO ]: info,
};

/**
 * React component to render a block message.
 *
 * @param {MessageProps} props - Component props.
 * @return {React.ReactElement }    Banner component.
 */
export default function Message( {
	severity = null,
	icon = null,
	children,
}: MessageProps ): React.ReactElement {
	return (
		<div className="jetpack-ai-assistant__message">
			{ ( severity || icon ) && <Icon icon={ messageIconsMap[ severity ] || icon } /> }
			<div className="jetpack-ai-assistant__message-content">{ children }</div>
		</div>
	);
}
