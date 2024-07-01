/**
 * External dependencies
 */
import { ExternalLink, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, check, arrowRight } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import './style.scss';
import errorExclamation from '../../icons/error-exclamation.js';
import { ERROR_QUOTA_EXCEEDED } from '../../types.js';
/**
 * Types
 */
import type { SuggestionErrorCode } from '../../types.js';
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

export type OnUpgradeClick = ( event?: React.MouseEvent< HTMLButtonElement > ) => void;

export type UpgradeMessageProps = {
	requestsRemaining: number;
	severity?: MessageSeverityProp;
	onUpgradeClick: OnUpgradeClick;
	upgradeUrl?: string;
};

export type ErrorMessageProps = {
	error?: string;
	code?: SuggestionErrorCode;
	onTryAgainClick: () => void;
	onUpgradeClick: OnUpgradeClick;
	upgradeUrl?: string;
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
			className={ clsx(
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
	severity,
	onUpgradeClick,
	upgradeUrl,
}: UpgradeMessageProps ): React.ReactElement {
	let messageSeverity = severity;

	if ( messageSeverity == null ) {
		messageSeverity = requestsRemaining > 0 ? MESSAGE_SEVERITY_INFO : MESSAGE_SEVERITY_WARNING;
	}

	return (
		<Message severity={ messageSeverity }>
			<span>
				{ sprintf(
					// translators: %1$d: number of requests remaining
					__( 'You have %1$d requests remaining.', 'jetpack-ai-client' ),
					requestsRemaining
				) }
			</span>
			<Button
				variant="link"
				onClick={ onUpgradeClick }
				href={ upgradeUrl }
				target={ upgradeUrl ? '_blank' : null }
			>
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
export function ErrorMessage( {
	error,
	code,
	onTryAgainClick,
	onUpgradeClick,
	upgradeUrl,
}: ErrorMessageProps ): React.ReactElement {
	const errorMessage = error || __( 'Something went wrong', 'jetpack-ai-client' );

	return (
		<Message severity={ MESSAGE_SEVERITY_ERROR }>
			<span>
				{ sprintf(
					// translators: %1$d: A dynamic error message
					__( 'Error: %1$s', 'jetpack-ai-client' ),
					errorMessage
				) }
			</span>
			{ code === ERROR_QUOTA_EXCEEDED ? (
				<Button
					variant="link"
					onClick={ onUpgradeClick }
					href={ upgradeUrl }
					target={ upgradeUrl ? '_blank' : null }
				>
					{ __( 'Upgrade now', 'jetpack-ai-client' ) }
				</Button>
			) : (
				<Button variant="link" onClick={ onTryAgainClick }>
					{ __( 'Try again', 'jetpack-ai-client' ) }
				</Button>
			) }
		</Message>
	);
}
