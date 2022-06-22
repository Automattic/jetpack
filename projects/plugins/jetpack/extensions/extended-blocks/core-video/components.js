import { createContext } from '@wordpress/element';

/**
 * VideoPress Block context
 * Used to pass data between components of a VideoPress Block.
 */
export const VideoPressBlockContext = createContext();

/**
 * VideoPress Block Provider
 *
 * @param {object}  props - Provider properties.
 * @param {Function}  props.onFilesSelected - Callback when video files have been selected
 * @param {Function}  props.onMediaItemSelected - Callback when video files have been selected
 * @param {Function}  props.onUploadFinished - Callback when video file upload finished
 * @param {boolean} props.children - Provider Children.
 * @returns {*} Provider component.
 */
export const VideoPressBlockProvider = ( {
	onFilesSelected,
	onMediaItemSelected,
	onUploadFinished,
	children,
} ) => {
	return (
		<VideoPressBlockContext.Provider
			value={ { onFilesSelected, onMediaItemSelected, onUploadFinished } }
			children={ children }
		/>
	);
};
