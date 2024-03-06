import type { Dispatch, SetStateAction } from 'react';

export type Notice = {
	message: string;
	options: {
		status: string;
		actions?: {
			label: string;
			onClick: () => void;
			noDefaultClasses?: boolean;
		};
	};
};

export type NoticeContextType< T = Notice > = {
	currentNotice: T;
	setNotice: Dispatch< SetStateAction< T > > | null;
};
