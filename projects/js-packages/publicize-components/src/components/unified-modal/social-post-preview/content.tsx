import { Flex } from '@wordpress/components';
import { Connection } from '../../../social-store/types';
import { PostPreview } from '../../social-post-modal/post-preview';
import styles from './styles.module.scss';

type ContentProps = {
	selectedConnection: Connection;
};

/**
 * Content component for the social preview modal.
 *
 * @param {ContentProps} props - The component props.
 * @return - Content component.
 */
export function Content( { selectedConnection }: ContentProps ) {
	return (
		<div className={ styles.content }>
			<Flex className={ styles.preview } align="center" justify="center">
				<PostPreview connection={ selectedConnection } />
			</Flex>
		</div>
	);
}
