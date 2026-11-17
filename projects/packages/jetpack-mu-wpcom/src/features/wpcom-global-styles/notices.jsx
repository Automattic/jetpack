/* global wpcomGlobalStyles */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { createRoot, useCallback, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { ThemeProvider } from '@wordpress/theme';
import { Button, Notice } from '@wordpress/ui';
import { wpcomTrackEvent } from '../../common/tracks';
import { useCanvas } from './use-canvas';
import { useGlobalStylesConfig } from './use-global-styles-config';
import useGlobalStyleNoticeActions from './use-global-styles-notice-actions';
import { usePreview } from './use-preview';

import './notice.scss';

const GLOBAL_STYLES_VIEW_NOTICE_SELECTOR = 'wpcom-global-styles-notice-container';

// Matches the site editor's dark navigation sidebar, so the notice's tokens are tuned for it.
const SIDEBAR_THEME_COLOR = { background: '#1e1e1e' };

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
	const { upgrade, reset, learnMore } = useGlobalStyleNoticeActions( {
		isSiteEditor: true,
		context: 'view_canvas',
	} );

	useEffect( () => {
		trackEvent( 'calypso_global_styles_gating_notice_view_canvas_show' );
	}, [] );

	const planName = wpcomGlobalStyles.planName;

	const notice = (
		<div className="wpcom-global-styles-notice">
			<Notice.Root intent="warning">
				<Notice.Description>
					{ sprintf(
						/* translators: %s is the short-form Premium plan name */
						__(
							'Your site includes premium styles that are only visible to visitors after upgrading to the %s plan or higher.',
							'jetpack-mu-wpcom'
						),
						planName
					) }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton variant="solid" onClick={ upgrade.onClick }>
						{ upgrade.label }
						<Button.Icon icon={ external } />
					</Notice.ActionButton>
					<Notice.ActionButton variant="outline" onClick={ reset.onClick }>
						{ reset.label }
					</Notice.ActionButton>
					<Notice.ActionLink
						href={ wpcomGlobalStyles.learnMoreAboutStylesUrl }
						onClick={ event => {
							event.preventDefault();
							learnMore.onClick();
						} }
					>
						{ learnMore.label }
					</Notice.ActionLink>
				</Notice.Actions>
			</Notice.Root>
		</div>
	);

	// Undefined while core's `wp-theme` exposes only private APIs.
	if ( ! ThemeProvider ) {
		return notice;
	}

	return <ThemeProvider color={ SIDEBAR_THEME_COLOR }>{ notice }</ThemeProvider>;
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
				label: __( 'Preview without premium styles', 'jetpack-mu-wpcom' ),
				onClick: previewPost,
				variant: 'secondary',
				noDefaultClasses: true,
				className: 'wpcom-global-styles-action-has-icon wpcom-global-styles-action-is-external',
			} );
		}

		if ( isSiteEditor ) {
			actions.push( reset );
		}

		actions.push( learnMore );

		const planName = wpcomGlobalStyles.planName;
		createWarningNotice(
			sprintf(
				/* translators: %s is the short-form Premium plan name */
				__(
					'Your site includes premium styles that are only visible to visitors after upgrading to the %s plan or higher.',
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
