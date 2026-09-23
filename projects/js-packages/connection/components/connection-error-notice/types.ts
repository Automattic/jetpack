import type {
	ConnectionErrorGroup,
	ConnectionErrorNoticeLink,
} from '../../hooks/use-connection-error-notice/types';
import type { ReactElement } from 'react';

export interface ActionItem {
	label: string;
	onClick: () => void;
	isLoading?: boolean;
	loadingText?: string;
	variant?: 'primary' | 'secondary';
}

export interface ConnectionErrorNoticeProps {
	message?: string | ReactElement;
	context?: string | ReactElement;
	restoreConnectionCallback?: ( () => void ) | null;
	isRestoringConnection?: boolean;
	restoreConnectionError?: string | null;
	actions?: ActionItem[];
	errorGroups?: ConnectionErrorGroup[];
	showSupportLink?: boolean;
	/** Fired when a notice-body link (e.g. "Visit Site Health") is clicked. */
	onNoticeLinkClick?: ( link: ConnectionErrorNoticeLink ) => void;
	/** Fired when the "Contact Jetpack Support" link is clicked. */
	onSupportLinkClick?: () => void;
}
