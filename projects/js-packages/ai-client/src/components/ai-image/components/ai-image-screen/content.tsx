/**
 * Internal dependencies
 */
import Carrousel from '../carrousel.tsx';
import styles from './styles.module.scss';
/**
 * Types
 */
import type { ContentProps } from './types.ts';

/**
 * Content component for the AI Image modal screen - displays the image preview with carousel
 *
 * @param {ContentProps} props - Component props
 * @return {JSX.Element} The Content component
 */
export function Content( {
	images,
	currentIndex,
	handlePreviousImage,
	handleNextImage,
	acceptButton,
}: ContentProps ) {
	return (
		<div className={ styles.content }>
			<Carrousel
				images={ images }
				current={ currentIndex }
				handlePreviousImage={ handlePreviousImage }
				handleNextImage={ handleNextImage }
				actions={ acceptButton }
			/>
		</div>
	);
}
