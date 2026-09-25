import { MediaItem, SocialPreviewBaseProps, SocialPreviewsBaseProps } from '../types';

export type TwitterPreviewsProps = SocialPreviewsBaseProps & {
	tweets: Array< TwitterPreviewProps >;
};

export type TwitterCardProps = Pick<
	SocialPreviewBaseProps,
	'image' | 'imageFocalPoint' | 'title' | 'url' | 'description'
> & {
	// Accepted so existing consumers keep type-checking; the current X link
	// card has no card-type variants, so it is not rendered.
	cardType?: string;
};

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
};

export type TwitterPreviewProps = SidebarProps &
	HeaderProps &
	Partial<
		QuoteTweetProps &
			TwitterCardProps &
			Pick< TextProps, 'text' > &
			Pick< SocialPreviewBaseProps, 'description' | 'media' | 'caption' >
	>;
