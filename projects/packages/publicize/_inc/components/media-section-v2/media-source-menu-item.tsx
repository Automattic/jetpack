/**
 * MediaSourceMenuItem component
 */

import { Icon, MenuItem } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { MediaSourceOption, MediaSourceType } from './types';

/**
 * Props for MediaSourceMenuItem component
 */
export interface MediaSourceMenuItemProps {
	/**
	 * Menu option data
	 */
	option: MediaSourceOption;

	/**
	 * Whether this option is currently selected
	 */
	isSelected: boolean;

	/**
	 * Callback when the option is selected
	 */
	onSelect: ( optionId: MediaSourceType ) => void;

	/**
	 * Callback to close the dropdown
	 */
	onClose: () => void;

	/**
	 * Callback when Media Library option is clicked
	 */
	onMediaLibraryClick?: () => void;

	/**
	 * Callback when Generate with AI option is clicked
	 */
	onAiImageClick?: () => void;

	/**
	 * Whether the menu item is disabled
	 */
	disabled?: boolean;
}

/**
 * MediaSourceMenuItem component
 *
 * @param {MediaSourceMenuItemProps} props - Component props
 * @return {JSX.Element} MediaSourceMenuItem component
 */
export default function MediaSourceMenuItem( {
	option,
	isSelected,
	onSelect,
	onClose,
	onMediaLibraryClick,
	onAiImageClick,
	disabled = false,
}: MediaSourceMenuItemProps ) {
	const handleClick = useCallback( () => {
		/*
		 * Media library / AI image always re-open their picker even when active —
		 * re-clicking the active item means "let me swap to a different image".
		 * For terminal sources (sig / featured-image / Default), re-clicking is a no-op.
		 */
		if ( option.id === 'media-library' ) {
			onMediaLibraryClick?.();
		} else if ( option.id === 'ai-image' ) {
			onAiImageClick?.();
		} else if ( ! isSelected ) {
			onSelect( option.id );
		}
		onClose();
	}, [ isSelected, option.id, onSelect, onClose, onMediaLibraryClick, onAiImageClick ] );

	return (
		<MenuItem
			role="menuitemradio"
			icon={ option.icon }
			iconPosition="left"
			isSelected={ isSelected }
			suffix={ isSelected ? <Icon icon={ check } /> : undefined }
			onClick={ handleClick }
			disabled={ disabled }
		>
			{ option.label }
		</MenuItem>
	);
}
