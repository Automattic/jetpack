import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, _x } from '@wordpress/i18n';
import { useMemo } from 'react';
import usePublicizeConfig from '../../../hooks/use-publicize-config';
import ScheduleButton from '../../schedule-button';
import { SharePostButton } from '../../share-post-button';
import { ScreenDetails } from '../types';

/**
 * Hook to get footer actions for social post preview modal.
 *
 * @return footer actions
 */
export function useFooterActions(): ScreenDetails[ 'footerActions' ] {
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const { isRePublicizeFeatureAvailable } = usePublicizeConfig();

	const isPrePublishScreen = useSelect( select => {
		const store = select( editorStore );
		return ! store.isCurrentPostPublished() && store.isPublishSidebarOpened();
	}, [] );

	return useMemo( () => {
		if ( isPostPublished && isRePublicizeFeatureAvailable ) {
			return [
				() => <ScheduleButton key="schedule" />,
				( { navigate } ) => <SharePostButton key="share" onShareCompleted={ navigate } />,
			];
		}

		return [
			( { navigate } ) => (
				<Button key="save" variant="primary" onClick={ navigate }>
					{ isPrePublishScreen
						? __( 'Continue', 'jetpack-publicize-pkg' )
						: _x( 'Close', 'Button text to close the modal.', 'jetpack-publicize-pkg' ) }
				</Button>
			),
		];
	}, [ isPostPublished, isRePublicizeFeatureAvailable, isPrePublishScreen ] );
}
