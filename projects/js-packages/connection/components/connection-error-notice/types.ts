import type { ConnectionErrorSeverity } from '../../hooks/use-connection-error-notice/types';
import type { ConnectionErrorDetailsProps } from '../connection-error-details/types';
import type { ReactElement } from 'react';

export interface ActionItem {
	label: string;
	onClick: () => void;
	isLoading?: boolean;
	loadingText?: string;
	variant?: 'primary' | 'secondary';
}

/**
 * The notice's own chrome, plus everything `ConnectionErrorDetails` renders
 * inside it at the notice's default type scale.
 */
export interface ConnectionErrorNoticeProps extends Omit< ConnectionErrorDetailsProps, 'variant' > {
	context?: string | ReactElement;
	restoreConnectionCallback?: ( () => void ) | null;
	isRestoringConnection?: boolean;
	restoreConnectionError?: string | null;
	actions?: ActionItem[];
	/** How the notice reads to this viewer; `warning` for a break only somebody else can repair. */
	severity?: ConnectionErrorSeverity;
}
