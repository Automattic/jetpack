import type { ReactElement } from 'react';

export interface ActionItem {
	label: string;
	onClick: () => void;
	isLoading?: boolean;
	loadingText?: string;
	variant?: 'primary' | 'secondary';
}

export interface ConnectionErrorNoticeProps {
	message: string | ReactElement;
	context?: string | ReactElement;
	restoreConnectionCallback?: ( () => void ) | null;
	isRestoringConnection?: boolean;
	restoreConnectionError?: string | null;
	actions?: ActionItem[];
}
