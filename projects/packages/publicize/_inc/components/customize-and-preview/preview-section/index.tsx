import { Flex, Notice } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Connection } from '../../../social-store/types';
import { PostPreview } from '../../social-post-modal/post-preview';
import styles from './styles.module.scss';

type PreviewSectionProps = {
	connection: Connection;
};

/**
 * Preview section component.
 *
 * @param {PreviewSectionProps} props - The component props.
 * @return - Preview section component.
 */
export function PreviewSection( { connection }: PreviewSectionProps ) {
	return (
		<section
			aria-label={ __( 'Post Preview', 'jetpack-publicize-pkg' ) }
			className={ styles[ 'preview-section' ] }
		>
			{ connection.enabled ? (
				<>
					<h2>
						{ _x( 'Preview', 'Noun: Post preview section heading', 'jetpack-publicize-pkg' ) }
					</h2>
					<PostPreview connection={ connection } />
				</>
			) : (
				<Flex className={ styles[ 'inactive-preview' ] } justify="center">
					<Notice isDismissible={ false } status="info">
						{ __( 'Enable sharing to this account to see the preview.', 'jetpack-publicize-pkg' ) }
					</Notice>
				</Flex>
			) }
		</section>
	);
}
