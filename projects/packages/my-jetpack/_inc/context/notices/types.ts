import type { Dispatch, SetStateAction } from 'react';

export type NoticeType = {
	message: string;
	options: {
		status: string;
	};
};

export type NoticeContextType< T = NoticeType > = {
	currentNotice: T;
	setCurrentNotice: Dispatch< SetStateAction< T > > | null;
};
