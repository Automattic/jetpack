/**
 * External dependencies
 */
import { ExternalLink, Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import './style.scss';
import errorExclamation from '../../icons/error-exclamation.tsx';
import { ERROR_QUOTA_EXCEEDED } from '../../types.ts';
import AiFeedbackThumbs from '../ai-feedback/index.tsx';
/**
 * Types
 */
import type { SuggestionErrorCode } from '../../types.ts';
import type React from 'react';

export const MESSAGE_SEVERITY_WARNING = 'warning';
export const MESSAGE_SEVERITY_ERROR = 'error';
export const MESSAGE_SEVERITY_SUCCESS = 'success';
export const MESSAGE_SEVERITY_INFO = 'info';

export type MessageSeverityProp =
	| typeof MESSAGE_SEVERITY_WARNING
	| typeof MESSAGE_SEVERITY_ERROR
	| typeof MESSAGE_SEVERITY_SUCCESS
	| typeof MESSAGE_SEVERITY_INFO
	| null;

type AiFeedbackThumbsOptions = {
	showAIFeedbackThumbs?: boolean;
	ratedItem?: string;
	prompt?: string;
	block?: string | null;
	onRate?: ( rating: string ) => void;
};

export type MessageProps = {
	icon?: React.ReactNode;
	severity?: MessageSeverityProp;
	aiFeedbackThumbsOptions?: AiFeedbackThumbsOptions;
	children: React.ReactNode;
};

export type GuidelineMessageProps = {
	aiFeedbackThumbsOptions?: AiFeedbackThumbsOptions;
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
 * @return {React.ReactElement}    Banner component.
 */
export default function Message( {
	severity = MESSAGE_SEVERITY_INFO,
	icon = null,
	aiFeedbackThumbsOptions = {
		showAIFeedbackThumbs: false,
		ratedItem: '',
		prompt: '',
		block: null,
		onRate: () => {},
	},
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
			{ <div className="jetpack-ai-assistant__message-content">{ children }</div> }
			{ aiFeedbackThumbsOptions.showAIFeedbackThumbs && aiFeedbackThumbsOptions.prompt && (
				<AiFeedbackThumbs
					disabled={ false }
					ratedItem={ aiFeedbackThumbsOptions.ratedItem }
					feature="ai-assistant"
					options={ {
						prompt: aiFeedbackThumbsOptions.prompt,
						block: aiFeedbackThumbsOptions.block,
					} }
					onRate={ aiFeedbackThumbsOptions.onRate }
				/>
			) }
		</div>
	);
}

/**
 * React component to render a learn more link.
 *
 * @return {React.ReactElement} - Learn more link component.
 */
function LearnMoreLink(): React.ReactElement {
	return (
		<ExternalLink href="https://jetpack.com/redirect/?source=ai-guidelines">
			{ __( 'Learn more', 'jetpack-ai-client' ) }
		</ExternalLink>
	);
}

/**
 * React component to render a guideline message.
 *
 * @param {GuidelineMessageProps} props - Component props.
 * @return {React.ReactElement} - Message component.
 */
export function GuidelineMessage( {
	aiFeedbackThumbsOptions = {
		showAIFeedbackThumbs: false,
		ratedItem: '',
		prompt: '',
		block: null,
		onRate: () => {},
	},
}: GuidelineMessageProps ): React.ReactElement {
	return (
		<Message aiFeedbackThumbsOptions={ aiFeedbackThumbsOptions }>
			<span>
				{ __( 'AI-generated content could be inaccurate or biased.', 'jetpack-ai-client' ) }
			</span>
			<LearnMoreLink />
		</Message>
	);
}

/**
 * React component to render a fair usage limit message.
 *
 * @return {React.ReactElement} - Message component.
 */
export function FairUsageLimitMessage(): React.ReactElement {
	const message = __(
		"You've reached this month's request limit, per our <link>fair usage policy</link>",
		'jetpack-ai-client'
	);
	const element = createInterpolateElement( message, {
		link: (
			<ExternalLink href="https://jetpack.com/redirect/?source=ai-assistant-fair-usage-policy" />
		),
	} );

	return <Message severity={ MESSAGE_SEVERITY_WARNING }>{ element }</Message>;
}

/**
 * React component to render an upgrade message for free tier users
 *
 * @param {number} requestsRemaining - Number of requests remaining.
 * @return {React.ReactElement} - Message component.
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
 * @return {React.ReactElement} - Message component.
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
