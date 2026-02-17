import { Icon, VisuallyHidden } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
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
					<VisuallyHidden as="h2">
						{ _x( 'Preview', 'Noun: Post preview section heading', 'jetpack-publicize-pkg' ) }
					</VisuallyHidden>
					<div className={ styles[ 'preview-wrapper' ] }>
						<PostPreview connection={ connection } />
					</div>
				</>
			) : (
				<div className={ styles[ 'inactive-preview' ] }>
					<Icon icon={ info } size={ 48 } />
					<div>{ __( "The post won't be shared to this account.", 'jetpack-publicize-pkg' ) }</div>
				</div>
			) }
		</section>
	);
}
