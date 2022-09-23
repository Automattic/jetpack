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
	/**
	 * Callback to be invoked when clicking on the `Update thumbnail` button.
	 */
	onUpdateVideoThumbnail?: ( event: MouseEvent< HTMLButtonElement > ) => void;
	/**
	 * Callback to be invoked when clicking on the `Update privacy` button.
	 */
	onUpdateVideoPrivacy?: ( event: MouseEvent< HTMLButtonElement > ) => void;
	/**
	 * Callback to be invoked when clicking on the `Delete video` button.
	 */
	onDeleteVideo?: ( event: MouseEvent< HTMLButtonElement > ) => void;
}
