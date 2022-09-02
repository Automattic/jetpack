import type { VideoPressVideo } from '../video-row';

export type VideoListProps = {
	videos: Array< VideoPressVideo >;
	onClickEdit?: ( video: VideoPressVideo ) => void;
	hidePrivacy?: boolean;
	hideDuration?: boolean;
	hidePlays?: boolean;
	hideEditButton?: boolean;
	hideQuickActions?: boolean;
};
