import { MediaItem, SocialPreviewBaseProps, SocialPreviewsBaseProps } from '../types';

export type TwitterPreviewsProps = SocialPreviewsBaseProps & {
	tweets: Array< TwitterPreviewProps >;
};

export type TwitterCardProps = Pick< SocialPreviewBaseProps, 'image' | 'title' | 'url' >;

export type SidebarProps = {
	showThreadConnector?: boolean;
	profileImage?: string;
};

export type HeaderProps = {
	name?: string;
	date?: Date | number;
	screenName?: string;
};

export type MediaProps = {
	media: Array< MediaItem >;
};

export type QuoteTweetProps = {
	tweetUrl: string;
};

export type TextProps = {
	text: string;
	url: string;
	retainUrl?: boolean;
};

export type TwitterPreviewProps = SidebarProps &
	HeaderProps &
	Partial<
		QuoteTweetProps &
			TwitterCardProps &
			Pick< TextProps, 'text' > &
			Pick< SocialPreviewBaseProps, 'description' | 'media' | 'caption' >
	>;
