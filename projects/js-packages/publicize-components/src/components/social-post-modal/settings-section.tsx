import { Panel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, _x } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { SharePostForm } from '../form/share-post-form';
import { SharePostButton } from '../share-post';
import { ScheduledShares } from './scheduled-shares';
import styles from './styles.module.scss';

/**
 * Settings section of the social post modal.
 *
 * @param {object}   props            - Component props.
 * @param {Function} props.onReShared - Callback function to be called when the post is reshared.
 * @return {import('react').ReactNode} - Settings section of the social post modal.
 */
export function SettingsSection( { onReShared } ) {
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const { isRePublicizeUpgradableViaUpsell } = usePublicizeConfig();

	return (
		<div className={ styles[ 'settings-section' ] }>
			<div className={ styles[ 'settings-header' ] }>
				<h2>
					{ isPostPublished
						? _x( 'Share Post', 'The title of the social modal', 'jetpack-publicize-components' )
						: __( 'Social Preview', 'jetpack-publicize-components' ) }
				</h2>
			</div>
			<div className={ styles[ 'settings-content' ] }>
				<p className={ styles[ 'modal-description' ] }>
					{ __(
						'Edit and preview your social post before sharing.',
						'jetpack-publicize-components'
					) }
				</p>
				<SharePostForm analyticsData={ { location: 'preview-modal' } } />
				{ isPostPublished && ! isRePublicizeUpgradableViaUpsell && (
					<div className={ styles[ 'share-button' ] }>
						<SharePostButton onShareCompleted={ onReShared } />
					</div>
				) }
			</div>
			{ isPostPublished ? (
				<div>
					<Panel>
						<ScheduledShares postId={ postId } />
					</Panel>
				</div>
			) : null }
		</div>
	);
}
