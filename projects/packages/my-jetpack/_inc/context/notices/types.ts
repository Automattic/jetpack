import type { NoticeAction } from '@wordpress/components/src/notice/types';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type NoticeButtonAction = NoticeAction & {
	isLoading?: boolean;
	loadingText?: string;
	isDisabled?: boolean;
};

export type Notice = {
	message: string | ReactNode;
	title?: string;
	options: {
		level: string;
		actions?: NoticeButtonAction[];
		priority: number;
		hideCloseButton?: boolean;
		onClose?: () => void;
	};
};

export type NoticeContextType< T = Notice > = {
	currentNotice: T;
	setNotice: Dispatch< SetStateAction< T > > | null;
	resetNotice: () => void;
};
