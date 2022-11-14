import React, { MouseEvent } from 'react';

export interface ActionItemProps extends React.ButtonHTMLAttributes< HTMLButtonElement > {
	/**
	 * Icon that will be displayed in the button.
	 */
	icon: React.ReactNode;
	/**
	 * Content that will be rendered at Popover.
	 */
	children: React.ReactNode;
	/**
	 * className to apply to the wrapper.
	 */
	className?: string;
}

export interface PopoverWithAnchorProps {
	/**
	 * Whether the popover should be rendered or not
	 */
	showPopover?: boolean;
	/**
	 * Whether the anchor is focused
	 */
	isAnchorFocused?: boolean;
	/**
	 * Ref that anchors the popover
	 */
	anchor: HTMLElement | null;
	/**
	 * Popover content
	 */
	children: React.ReactNode;
}

/**
 * Privacy setting of the video.
 * - 0: `public`
 * - 1: `private`
 * - 2: `site default`
 */
type privacySetting = 0 | 1 | 2;

export interface VideoQuickActionsProps {
	/**
	 * className to apply to the component
	 */
	className?: string;

	privacySetting?: privacySetting;
	isUpdatingPrivacy?: boolean;
	isUpdatingPoster?: boolean;

	onUpdateVideoThumbnail?: ( action: 'default' | 'select-from-video' | 'upload-image' ) => void;
	onUpdateVideoPrivacy?: ( action: 'site-default' | 'public' | 'private' ) => void;
	onDeleteVideo?: ( event: MouseEvent< HTMLButtonElement > ) => void;
}

export interface ConnectVideoQuickActionsProps {
	/**
	 * className to apply to the component
	 */
	className?: string;

	/**
	 * Post ID of the video item.
	 */
	videoId: number | string;

	onUpdateVideoThumbnail?: ( action: 'default' | 'select-from-video' | 'upload-image' ) => void;
	onUpdateVideoPrivacy?: ( action: 'site-default' | 'public' | 'private' ) => void;
	onDeleteVideo?: ( event: MouseEvent< HTMLButtonElement > ) => void;
}

export type ThumbnailActionsDropdownProps = {
	onUpdate: ( action: 'default' | 'select-from-video' | 'upload-image' ) => void;
	description: string;
	isUpdatingPoster?: boolean;
};

export type PrivacyActionsDropdownProps = {
	onUpdate: ( action: 'site-default' | 'public' | 'private' ) => void;
	privacySetting?: privacySetting;
	isUpdatingPrivacy?: boolean;
	description: string;
};
