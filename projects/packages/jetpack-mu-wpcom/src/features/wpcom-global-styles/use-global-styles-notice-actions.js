/* global wpcomGlobalStyles */
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { wpcomTrackEvent } from '../../common/tracks';
import { useGlobalStylesConfig } from './use-global-styles-config';

const trackEvent = ( eventName, isSiteEditor = true ) =>
	wpcomTrackEvent( eventName, {
		context: isSiteEditor ? 'site-editor' : 'post-editor',
		blog_id: wpcomGlobalStyles.wpcomBlogId,
	} );

/**
 * Hook for actions used by different notices.
 *
 * @param {object}  options              - Options object.
 * @param {boolean} options.isSiteEditor - Whether the notice is displayed in the site editor.
 * @param {string}  options.context      - The context where the notice is displayed, for tracking purposes.
 * @return {object} The shared notice actions.
 */
export default function useGlobalStyleNoticeActions( { isSiteEditor, context = 'edit_canvas' } ) {
	const { editEntityRecord } = useDispatch( 'core' );
	const { globalStylesId } = useGlobalStylesConfig();
	const helpCenterDispatch = useDispatch( 'automattic/help-center' );
	const setShowHelpCenter = helpCenterDispatch?.setShowHelpCenter;
	const setShowSupportDoc = helpCenterDispatch?.setShowSupportDoc;

	const upgradePlan = useCallback( () => {
		window.open( wpcomGlobalStyles.upgradeUrl, '_blank' ).focus();

		if ( context === 'view_canvas' ) {
			trackEvent( 'calypso_global_styles_notice_view_canvas_upgrade_click', isSiteEditor );
		} else {
			trackEvent( 'calypso_global_styles_gating_notice_upgrade_click', isSiteEditor );
		}
	}, [ context, isSiteEditor ] );

	const resetGlobalStyles = useCallback( () => {
		if ( ! globalStylesId ) {
			return;
		}

		editEntityRecord( 'root', 'globalStyles', globalStylesId, {
			styles: {},
			settings: {},
		} );

		if ( context === 'view_canvas' ) {
			trackEvent( 'calypso_global_styles_notice_view_canvas_reset_click', isSiteEditor );
		} else {
			trackEvent( 'calypso_global_styles_gating_notice_reset_click', isSiteEditor );
		}
	}, [ context, editEntityRecord, globalStylesId, isSiteEditor ] );

	const openLearnMoreAboutStylesDialog = useCallback( () => {
		if ( setShowHelpCenter && setShowSupportDoc ) {
			setShowHelpCenter( true );
			setShowSupportDoc(
				wpcomGlobalStyles.learnMoreAboutStylesUrl,
				wpcomGlobalStyles.learnMoreAboutStylesPostId
			);
		} else {
			window.open( wpcomGlobalStyles.learnMoreAboutStylesUrl, '_blank' ).focus();
		}

		if ( context === 'view_canvas' ) {
			trackEvent( 'calypso_global_styles_notice_view_canvas_learn_more_click', isSiteEditor );
		} else {
			trackEvent( 'calypso_global_styles_gating_notice_learn_more_click', isSiteEditor );
		}
	}, [ context, isSiteEditor, setShowHelpCenter, setShowSupportDoc ] );

	return {
		learnMore: {
			label: __( 'Learn more', 'jetpack-mu-wpcom' ),
			onClick: openLearnMoreAboutStylesDialog,
			variant: 'link',
			noDefaultClasses: true,
		},
		reset: {
			label: __( 'Remove premium styles', 'jetpack-mu-wpcom' ),
			onClick: resetGlobalStyles,
			variant: 'secondary',
			noDefaultClasses: true,
		},
		upgrade: {
			label: __( 'Upgrade now', 'jetpack-mu-wpcom' ),
			onClick: upgradePlan,
			variant: 'primary',
			noDefaultClasses: true,
			className: clsx(
				'wpcom-global-styles-action-is-upgrade',
				'wpcom-global-styles-action-has-icon',
				'wpcom-global-styles-action-is-external'
			),
		},
	};
}
