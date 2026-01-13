/**
 * MediaSourceMenuItem component
 */

import { MenuItem } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
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
}: MediaSourceMenuItemProps ) {
	const handleClick = useCallback( () => {
		if ( option.id === 'media-library' ) {
			onMediaLibraryClick?.();
		} else if ( option.id === 'ai-image' ) {
			onAiImageClick?.();
		} else {
			onSelect( option.id );
		}
		onClose();
	}, [ option.id, onSelect, onClose, onMediaLibraryClick, onAiImageClick ] );

	return (
		<MenuItem
			key={ option.id }
			icon={ option.icon }
			isSelected={ isSelected }
			onClick={ handleClick }
		>
			{ option.label }
		</MenuItem>
	);
}
