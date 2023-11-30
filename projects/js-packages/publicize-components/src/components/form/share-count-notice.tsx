import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useShareLimits } from '../../hooks/use-share-limits';
import { store as socialStore } from '../../social-store';
import Notice from '../notice';
import styles from './styles.module.scss';

export const ShareCountNotice: React.FC = () => {
	const { isEditedPostDirty } = useSelect( editorStore, [] );
	const { autosave } = useDispatch( editorStore );

	const { showShareLimits, enabledConnectionsCount, initialEnabledConnectionsCount } = useSelect(
		select => ( {
			showShareLimits: select( socialStore ).showShareLimits(),
			enabledConnectionsCount: select( socialStore ).getEnabledConnections().length,
			initialEnabledConnectionsCount: select( socialStore ).getInitialEnabledConnectionsCount(),
		} ),
		[]
	);

	const autosaveAndRedirect = useCallback(
		async ev => {
			const target = ev.target.getAttribute( 'target' );
			if ( isEditedPostDirty() && ! target ) {
				ev.preventDefault();
				await autosave();
				window.location.href = ev.target.href;
			}
			if ( target ) {
				ev.preventDefault();
				window.open( ev.target.href, target, 'noreferrer' );
			}
		},
		[ autosave, isEditedPostDirty ]
	);
	const { noticeType, message } = useShareLimits( {
		enabledConnectionsCount,
		initialEnabledConnectionsCount,
	} );

	if ( ! showShareLimits || ! message ) {
		return null;
	}

	return (
		<Notice type={ noticeType }>
			{ message }
			<br />
			{ createInterpolateElement(
				__( '<upgradeLink>Upgrade now</upgradeLink> to share more.', 'jetpack' ),
				{
					upgradeLink: (
						<a
							className={ styles[ 'upgrade-link' ] }
							href={ getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
								site: getSiteFragment(),
								query: 'redirect_to=' + encodeURIComponent( window.location.href ),
							} ) }
							onClick={ autosaveAndRedirect }
						/>
					),
				}
			) }
		</Notice>
	);
};
