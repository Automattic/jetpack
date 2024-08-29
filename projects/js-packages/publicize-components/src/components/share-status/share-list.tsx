import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { ShareInfo } from './share-info';
import styles from './styles.module.scss';

/**
 * ShareList component
 *
 * @return {import('react').ReactNode} - Share status modal component.
 */
export function ShareList() {
	const { shareStatus } = useSelect( select => {
		const store = select( socialStore );
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/editor` is a nightmare to work with TypeScript
		const _editorStore = select( editorStore ) as any;

		return {
			shareStatus: store.getPostShareStatus( _editorStore.getCurrentPostId() ),
		};
	}, [] );

	return (
		<div className="connection-management">
			{ shareStatus.loading && (
				<div className={ styles.spinner }>
					<Spinner /> { __( 'Loading…', 'jetpack' ) }
				</div>
			) }
			{ shareStatus.shares.length > 0 && (
				<ul className={ styles[ 'share-log-list' ] }>
					{ shareStatus.shares.map( ( share, idx ) => (
						<li
							key={ `${ share.external_id || share.connection_id }${ idx }}` }
							className={ styles[ 'share-log-list-item' ] }
						>
							<ShareInfo share={ share } />
						</li>
					) ) }
				</ul>
			) }
		</div>
	);
}
