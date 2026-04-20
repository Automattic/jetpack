import { Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSocialUserPreferences } from '../../hooks/use-social-user-preferences';
import { store as socialStore } from '../../social-store';
import styles from './single-x-notice.module.scss';

/**
 * Info notice shown in the sidebar when the user toggles a second X
 * connection on and the single-X-per-post rule auto-disables the previous
 * one. Dismissed state is persisted per-user; once dismissed, the notice
 * never reappears.
 *
 * @return The single-X info notice, or null when it should not be shown.
 */
export function SingleXNotice() {
	const { data: preferences, set: setPreference } = useSocialUserPreferences();
	const shouldShow = useSelect( select => select( socialStore ).shouldShowSingleXNotice(), [] );
	const { setShouldShowSingleXNotice } = useDispatch( socialStore );

	const handleDismiss = useCallback( () => {
		setPreference( 'dismissedSingleXNotice', true );
		setShouldShowSingleXNotice( false );
	}, [ setPreference, setShouldShowSingleXNotice ] );

	if ( ! shouldShow || preferences.dismissedSingleXNotice ) {
		return null;
	}

	return (
		<Notice className={ styles[ 'single-x-notice' ] } status="info" onRemove={ handleDismiss }>
			{ __(
				"Per X's developer policy, Jetpack Social will only share each post to one X account, even when multiple are connected.",
				'jetpack-publicize-pkg'
			) }
		</Notice>
	);
}
