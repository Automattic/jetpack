import type { NoticeAction } from '@wordpress/components/src/notice/types';
import type { Dispatch, SetStateAction } from 'react';

export type NoticeButtonAction = NoticeAction & {
	isLoading?: boolean;
	loadingText?: string;
	isDisabled?: boolean;
};

export type Notice = {
	message: string;
	options: {
		level: string;
		actions?: NoticeButtonAction[];
		priority: number;
	};
};

export type NoticeContextType< T = Notice > = {
	currentNotice: T;
	setNotice: Dispatch< SetStateAction< T > > | null;
	resetNotice: () => void;
};
