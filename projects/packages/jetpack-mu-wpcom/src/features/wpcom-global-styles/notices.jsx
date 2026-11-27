/* global wpcomGlobalStyles */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { createRoot, useCallback, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { ButtonLink, Notice } from '@wordpress/ui';
import { wpcomTrackEvent } from '../../common/tracks';
import { useCanvas } from './use-canvas';
import { useGlobalStylesConfig } from './use-global-styles-config';
import useGlobalStyleNoticeActions from './use-global-styles-notice-actions';
import { usePreview } from './use-preview';

import './notice.scss';

const GLOBAL_STYLES_VIEW_NOTICE_SELECTOR = 'wpcom-global-styles-notice-container';

const trackEvent = ( eventName, isSiteEditor = true ) =>
	wpcomTrackEvent( eventName, {
		context: isSiteEditor ? 'site-editor' : 'post-editor',
		blog_id: wpcomGlobalStyles.wpcomBlogId,
	} );

/**
 * Limited GS notice for the view canvas of the site editor.
 *
 * @return {import('react').JSX.Element} The component to render.
 */
function GlobalStylesWarningNotice() {
	const { trackUpgradeClick, reset, learnMore } = useGlobalStyleNoticeActions( {
		isSiteEditor: true,
		context: 'view_canvas',
	} );

	useEffect( () => {
		trackEvent( 'calypso_global_styles_gating_notice_view_canvas_show' );
	}, [] );

	const planName = wpcomGlobalStyles.planName;

	return (
		<div className="wpcom-global-styles-notice-surround">
			<Notice.Root intent="warning" icon={ null } className="wpcom-global-styles-notice">
				<Notice.Description>
					{ sprintf(
						/* translators: %s is the short-form name of the plan that unlocks sitewide styles. The Styles panel is the Global Styles sidebar of the Site Editor. */
						__(
							'Your sitewide styles (changes made in the Styles panel) are only visible to visitors after upgrading to the %s plan or higher.',
							'jetpack-mu-wpcom'
						),
						planName
					) }
				</Notice.Description>
				<Notice.Actions>
					{ /* Workaround: switch once https://github.com/WordPress/gutenberg/pull/86959 is available. */ }
					<ButtonLink
						variant="solid"
						size="compact"
						href={ wpcomGlobalStyles.upgradeUrl }
						onClick={ trackUpgradeClick }
						openInNewTab
					>
						{ __( 'Upgrade now', 'jetpack-mu-wpcom' ) }
					</ButtonLink>
					<Notice.ActionButton variant="outline" onClick={ reset.onClick }>
						{ reset.label }
					</Notice.ActionButton>
					<Notice.ActionButton variant="minimal" onClick={ learnMore.onClick }>
						{ learnMore.label }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
		</div>
	);
}

/**
 * Renders a notice in the view canvas of the site editor when GS are limited.
 *
 * @return {null} This component is non-rendering.
 */
function GlobalStylesViewNotice() {
	const { canvas } = useCanvas();
	const { globalStylesInUse } = useGlobalStylesConfig();

	useEffect( () => {
		if ( ! globalStylesInUse || canvas !== 'view' ) {
			return;
		}

		const saveHub = document.querySelector( '.edit-site-save-hub' );
		if ( ! saveHub ) {
			return;
		}

		// Insert the notice as a sibling of the save hub instead of as a child,
		// to prevent our notice from breaking the flex styles of the hub.
		const noticeContainer = document.createElement( 'div' );
		noticeContainer.classList.add( GLOBAL_STYLES_VIEW_NOTICE_SELECTOR );
		saveHub.parentNode.insertBefore( noticeContainer, saveHub );

		const root = createRoot( noticeContainer );
		root.render( <GlobalStylesWarningNotice /> );

		return () => {
			root.unmount();
			noticeContainer.remove();
		};
	}, [ canvas, globalStylesInUse ] );

	return null;
}

/**
 * Limited GS notice for the edit view of the site editor.
 *
 * @return {null} This component is non-rendering.
 */
function GlobalStylesEditNotice() {
	const NOTICE_ID = 'wpcom-global-styles/gating-notice';
	const { globalStylesInUse } = useGlobalStylesConfig();
	const { canvas } = useCanvas();
	const { isSiteEditor, isPostEditor } = useSelect(
		select => ( {
			isSiteEditor: !! select( 'core/edit-site' ) && canvas === 'edit',
			isPostEditor: ! select( 'core/edit-site' ) && !! select( 'core/editor' ).getCurrentPostId(),
		} ),
		[ canvas ]
	);
	const { previewPostWithoutCustomStyles, canPreviewPost } = usePreview();

	const { upgrade, reset, learnMore } = useGlobalStyleNoticeActions( {
		isSiteEditor: true,
		context: 'view_canvas',
	} );

	const { createWarningNotice, removeNotice } = useDispatch( 'core/notices' );

	const previewPost = useCallback( () => {
		previewPostWithoutCustomStyles();
		trackEvent( 'calypso_global_styles_gating_notice_preview_click', isSiteEditor );
	}, [ isSiteEditor, previewPostWithoutCustomStyles ] );

	const showNotice = useCallback( () => {
		const actions = [ upgrade ];

		if ( isPostEditor && canPreviewPost ) {
			actions.push( {
				/* translators: Opens a preview of the post without the site styles. Site styles are the sitewide changes made in the Styles panel (Global Styles). Visitors only see them on a paid plan. */
				label: __( 'Preview without site styles', 'jetpack-mu-wpcom' ),
				onClick: previewPost,
				variant: 'secondary',
				noDefaultClasses: true,
			} );
		}

		if ( isSiteEditor ) {
			actions.push( reset );
		}

		actions.push( learnMore );

		const planName = wpcomGlobalStyles.planName;
		createWarningNotice(
			sprintf(
				/* translators: %s is the short-form name of the plan that unlocks sitewide styles. The Styles panel is the Global Styles sidebar of the Site Editor. */
				__(
					'Your sitewide styles (changes made in the Styles panel) are only visible to visitors after upgrading to the %s plan or higher.',
					'jetpack-mu-wpcom'
				),
				planName
			),
			{
				id: NOTICE_ID,
				actions: actions,
				isDismissible: false,
			}
		);

		trackEvent( 'calypso_global_styles_gating_notice_show', isSiteEditor );
	}, [
		canPreviewPost,
		createWarningNotice,
		isPostEditor,
		isSiteEditor,
		learnMore,
		previewPost,
		reset,
		upgrade,
	] );

	const isDistractionFree = useSelect(
		select => select( blockEditorStore ).getSettings().isDistractionFree,
		[]
	);

	useEffect( () => {
		if ( ! isSiteEditor && ! isPostEditor ) {
			return;
		}

		if ( globalStylesInUse && ! isDistractionFree ) {
			showNotice();
		} else {
			removeNotice( NOTICE_ID );
		}

		return () => removeNotice( NOTICE_ID );
	}, [
		globalStylesInUse,
		isDistractionFree,
		isSiteEditor,
		isPostEditor,
		removeNotice,
		showNotice,
	] );

	return null;
}

/**
 * Limited GS notices for the site editor.
 *
 * @return {import('react').JSX.Element} The component to render.
 */
export default function GlobalStylesNotices() {
	return (
		<QueryClientProvider client={ new QueryClient() }>
			<GlobalStylesViewNotice />
			<GlobalStylesEditNotice />
		</QueryClientProvider>
	);
}
