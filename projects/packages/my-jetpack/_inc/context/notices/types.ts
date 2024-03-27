import type { NoticeAction } from '@wordpress/components/src/notice/types';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type NoticeButtonAction = NoticeAction & {
	isLoading?: boolean;
	loadingText?: string;
	isDisabled?: boolean;
};

export type Notice = {
	message: string | ReactNode;
	options: {
		status: string;
		actions?: NoticeButtonAction[];
		priority: number;
		isRedBubble?: boolean;
	};
};

export type NoticeContextType< T = Notice > = {
	currentNotice: T;
	setNotice: Dispatch< SetStateAction< T > > | null;
	resetNotice: () => void;
};
