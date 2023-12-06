import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelRow } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useShareLimits } from '../../hooks/use-share-limits';
import { store as socialStore } from '../../social-store';
import Notice from '../notice';

export const ShareCountNotice: React.FC = () => {
	const { isEditedPostDirty } = useSelect( editorStore, [] );
	const { autosave } = useDispatch( editorStore );

	const showShareLimits = useSelect( select => select( socialStore ).showShareLimits(), [] );

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
	const { message } = useShareLimits();

	if ( ! showShareLimits ) {
		return null;
	}

	return (
		<PanelRow>
			<Notice
				type="warning"
				actions={ [
					<Button
						key="upgrade"
						variant="primary"
						onClick={ autosaveAndRedirect }
						href={ getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
							site: getSiteFragment(),
							query: 'redirect_to=' + encodeURIComponent( window.location.href ),
						} ) }
					>
						{ __( 'Upgrade', 'jetpack' ) }
					</Button>,
				] }
			>
				{ message }
			</Notice>
		</PanelRow>
	);
};
