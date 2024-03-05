import type { Dispatch, SetStateAction } from 'react';

export type NoticeType = {
	message: string;
	options: {
		status: string;
		actions?: {
			label: string;
			onClick: () => void;
			noDefaultClasses?: boolean;
		};
	};
	shouldShow?: boolean;
};

export type NoticeContextType< T = NoticeType > = {
	currentNotice: T;
	setCurrentNotice: Dispatch< SetStateAction< T > > | null;
};
