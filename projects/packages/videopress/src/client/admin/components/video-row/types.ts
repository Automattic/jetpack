export type VideoPressVideo = {
	id: number | string;
	videoTitle: string;
	posterImage?: string;
	uploadDate: string;
	duration?: number;
	plays?: number;
	isPrivate?: boolean;
};

export type VideoRowProps = VideoPressVideo & {
	className?: string;
	checked: boolean;
	onClickEdit?: () => void;
	onSelect?: ( check: boolean ) => void;
	hideEditButton?: boolean;
	hideQuickActions?: boolean;
};
