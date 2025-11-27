import { Flex } from '@wordpress/components';
import GeneratedImagePreview from '../../generated-image-preview';
import styles from './styles.module.scss';
import { LocalState } from './types';

type ContentProps = {
	localState: LocalState;
};

/**
 * Content component for the edit template modal.
 *
 * @param {ContentProps} props - The component props.
 * @return - Content component.
 */
export function Content( { localState }: ContentProps ) {
	return (
		<div className={ styles.content }>
			<Flex className={ styles.preview } align="center" justify="center">
				<GeneratedImagePreview
					imageId={ localState.imageId }
					customText={ localState.customText }
					imageType={ localState.imageType }
					template={ localState.template }
					font={ localState.font }
				/>
			</Flex>
		</div>
	);
}
