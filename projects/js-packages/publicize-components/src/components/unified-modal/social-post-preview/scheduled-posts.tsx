import { Panel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { ScheduledShares } from '../../social-post-modal/scheduled-shares';
import styles from './styles.module.scss';

/**
 * Scheduled shares section for the preview modal.
 *
 * @return React element
 */
export function ScheduledPosts() {
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );

	if ( ! isPostPublished ) {
		return null;
	}

	return (
		<Panel className={ styles[ 'scheduled-posts-panel' ] }>
			<ScheduledShares postId={ Number( postId ) } />
		</Panel>
	);
}
