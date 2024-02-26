/**
 * External dependencies
 */
import { ExternalLink, Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
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
 * @returns {React.ReactElement }    Banner component.
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

/**
 * React component to render a guideline message.
 *
 * @returns {React.ReactElement } - Message component.
 */
export function GuidelineMessage(): React.ReactElement {
	return (
		<Message severity={ MESSAGE_SEVERITY_INFO }>
			{ createInterpolateElement(
				__(
					'AI-generated content could be inaccurate or biased. <link>Learn more</link>',
					'jetpack-ai-client'
				),
				{
					link: <ExternalLink href="https://automattic.com/ai-guidelines" />,
				}
			) }
		</Message>
	);
}

/**
 * React component to render a upgrade message.
 *
 * @param {number} requestsRemaining - Number of requests remaining.
 * @returns {React.ReactElement } - Message component.
 */
export function UpgradeMessage( {
	requestsRemaining,
	onUpgradeClick,
}: {
	requestsRemaining: number;
	onUpgradeClick: () => void;
} ): React.ReactElement {
	return (
		<Message severity={ MESSAGE_SEVERITY_INFO }>
			{ createInterpolateElement(
				sprintf(
					// translators: %1$d: number of requests remaining
					__(
						'You have %1$d free requests remaining. <link>Upgrade</link> and avoid interruptions',
						'jetpack-ai-client'
					),
					requestsRemaining
				),
				{
					link: <Button variant="link" onClick={ onUpgradeClick } />,
				}
			) }
		</Message>
	);
}
