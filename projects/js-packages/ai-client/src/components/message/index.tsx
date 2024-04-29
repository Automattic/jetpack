/**
 * External dependencies
 */
import { ExternalLink, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, check, arrowRight } from '@wordpress/icons';
import classNames from 'classnames';
/**
 * Internal dependencies
 */
import './style.scss';
import errorExclamation from '../../icons/error-exclamation.js';
/**
 * Types
 */
import type React from 'react';

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
	severity?: MessageSeverityProp;
	showSidebarIcon?: boolean;
	onSidebarIconClick?: () => void;
	children: React.ReactNode;
};

export type UpgradeMessageProps = {
	requestsRemaining: number;
	onUpgradeClick: () => void;
};

export type ErrorMessageProps = {
	error?: string;
	onTryAgainClick: () => void;
};

const messageIconsMap = {
	[ MESSAGE_SEVERITY_INFO ]: null,
	[ MESSAGE_SEVERITY_WARNING ]: null,
	[ MESSAGE_SEVERITY_ERROR ]: errorExclamation,
	[ MESSAGE_SEVERITY_SUCCESS ]: check,
};

/**
 * React component to render a block message.
 *
 * @param {MessageProps} props - Component props.
 * @returns {React.ReactElement }    Banner component.
 */
export default function Message( {
	severity = MESSAGE_SEVERITY_INFO,
	icon = null,
	showSidebarIcon = false,
	onSidebarIconClick = () => {},
	children,
}: MessageProps ): React.ReactElement {
	return (
		<div
			className={ classNames(
				'jetpack-ai-assistant__message',
				`jetpack-ai-assistant__message-severity-${ severity }`
			) }
		>
			{ ( messageIconsMap[ severity ] || icon ) && (
				<Icon icon={ messageIconsMap[ severity ] || icon } />
			) }
			<div className="jetpack-ai-assistant__message-content">{ children }</div>
			{ showSidebarIcon && (
				<Button className="jetpack-ai-assistant__message-sidebar" onClick={ onSidebarIconClick }>
					<Icon size={ 20 } icon={ arrowRight } />
				</Button>
			) }
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
		<Message>
			<span>
				{ __( 'AI-generated content could be inaccurate or biased.', 'jetpack-ai-client' ) }
			</span>
			<ExternalLink href="https://automattic.com/ai-guidelines">
				{ __( 'Learn more', 'jetpack-ai-client' ) }
			</ExternalLink>
		</Message>
	);
}

/**
 * React component to render an upgrade message for free tier users
 *
 * @param {number} requestsRemaining - Number of requests remaining.
 * @returns {React.ReactElement } - Message component.
 */
export function UpgradeMessage( {
	requestsRemaining,
	onUpgradeClick,
}: UpgradeMessageProps ): React.ReactElement {
	return (
		<Message severity={ MESSAGE_SEVERITY_WARNING }>
			<span>
				{ sprintf(
					// translators: %1$d: number of requests remaining
					__( 'You have %1$d free requests remaining.', 'jetpack-ai-client' ),
					requestsRemaining
				) }
			</span>
			<Button variant="link" onClick={ onUpgradeClick }>
				{ __( 'Upgrade now', 'jetpack-ai-client' ) }
			</Button>
		</Message>
	);
}

/**
 * React component to render an error message
 *
 * @param {number} requestsRemaining - Number of requests remaining.
 * @returns {React.ReactElement } - Message component.
 */
export function ErrorMessage( { error, onTryAgainClick }: ErrorMessageProps ): React.ReactElement {
	const errorMessage = error || __( 'Something went wrong', 'jetpack-ai-client' );

	return (
		<Message severity={ MESSAGE_SEVERITY_ERROR }>
			<span>
				{ sprintf(
					// translators: %1$d: A dynamic error message
					__( 'Error: %1$s.', 'jetpack-ai-client' ),
					errorMessage
				) }
			</span>
			<Button variant="link" onClick={ onTryAgainClick }>
				{ __( 'Try Again', 'jetpack-ai-client' ) }
			</Button>
		</Message>
	);
}
