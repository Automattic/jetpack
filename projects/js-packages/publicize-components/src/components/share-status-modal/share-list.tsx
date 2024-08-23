import { usePostMeta } from '../../hooks/use-post-meta';
import { ShareInfo } from './share-info';
import styles from './styles.module.scss';

/**
 * ShareList component
 *
 * @return {import('react').ReactNode} - Share status modal component.
 */
export function ShareList() {
	const { postShares } = usePostMeta();

	return (
		<div className="connection-management">
			<ul className={ styles[ 'share-log-list' ] }>
				{ postShares.map( share => (
					<li key={ share.connection_id } className={ styles[ 'share-log-list-item' ] }>
						<ShareInfo share={ share } />
					</li>
				) ) }
			</ul>
		</div>
	);
}
