import { Flex } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useEffect } from 'react';
import { store as socialStore } from '../../../social-store';
import { Connection } from '../../../social-store/types';
import { MediaValidationNotices } from '../../form/media-validation-notices';
import { SharePostForm } from '../../form/share-post-form';
import { PostPreview } from '../../social-post-modal/post-preview';
import { ConnectionPanels } from './connection-panels';
import styles from './styles.module.scss';

type ContentProps = {
	baseId: string;
	selectedConnection: Connection;
	forSmallScreen?: boolean;
};

/**
 * Content component for the social preview modal.
 *
 * @param {ContentProps} props - The component props.
 * @return - Content component.
 */
export function Content( { baseId, selectedConnection, forSmallScreen }: ContentProps ) {
	const { incrementRenderCountFor } = useDispatch( socialStore );

	useEffect( () => {
		incrementRenderCountFor( 'social-preview' );
	}, [ incrementRenderCountFor ] );

	if ( forSmallScreen ) {
		return (
			<div className={ styles.content }>
				<Flex direction="column" gap={ 0 }>
					<ConnectionPanels />
					<div className={ styles[ 'notice-wrapper' ] }>
						<MediaValidationNotices />
					</div>
					<div className={ styles[ 'customization-form' ] }>
						<SharePostForm analyticsData={ { location: 'preview-modal' } } isInsideNavigatorModal />
					</div>
				</Flex>
			</div>
		);
	}

	return (
		<div
			className={ styles.content }
			role="tabpanel"
			tabIndex={ 0 }
			id={ `${ baseId }-preview-content-${ selectedConnection.connection_id }` }
			aria-labelledby={ `${ baseId }-preview-tab-${ selectedConnection.connection_id }` }
		>
			<Flex className={ styles.preview } align="center" justify="center">
				<PostPreview connection={ selectedConnection } />
			</Flex>
		</div>
	);
}
