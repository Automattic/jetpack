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
	 * Ref that anchors the popover
	 */
	anchorRef: HTMLElement | null;
	/**
	 * Popover content
	 */
	children: React.ReactNode;
}

export interface VideoQuickActionsProps {
	/**
	 * className to apply to the component
	 */
	className?: string;

	onUpdateVideoThumbnail?: ( action: 'default' | 'select-from-video' | 'upload-image' ) => void;
	onUpdateVideoPrivacy?: ( action: 'site-default' | 'public' | 'private' ) => void;
	onDeleteVideo?: ( event: MouseEvent< HTMLButtonElement > ) => void;
}

export type ThumbnailActionsDropdownProps = {
	onUpdate: ( action: 'default' | 'select-from-video' | 'upload-image' ) => void;
	description: string;
};

export type PrivacyActionsDropdownProps = {
	onUpdate: ( action: 'site-default' | 'public' | 'private' ) => void;
	description: string;
};
