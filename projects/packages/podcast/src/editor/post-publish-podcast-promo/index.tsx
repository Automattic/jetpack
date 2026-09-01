import jetpackAnalytics from '@automattic/jetpack-analytics';
import apiFetch from '@wordpress/api-fetch';
import { Button, Modal } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getPlugin, registerPlugin } from '@wordpress/plugins';

import './style.scss';

const recordPromoEvent = (
	eventName: string,
	properties: Record< string, string | number | boolean > = {}
): void => {
	try {
		jetpackAnalytics.tracks.recordEvent( eventName, properties );
	} catch {
		// Tracks is best-effort — never let it break the editor.
	}
};

type PromoData = {
	createUrl: string;
	dismissPath: string;
};

declare global {
	interface Window {
		jetpackPostPublishPodcastPromo?: PromoData;
	}
}

const getPromoData = (): PromoData | undefined => window.jetpackPostPublishPodcastPromo;

// The editor can emit an immediate request-close from the publish click/focus transition.
const requestCloseGracePeriod = 1000;

const PostPublishPodcastPromo = () => {
	const data = getPromoData();
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isClosedForSession, setIsClosedForSession ] = useState( false );
	const openedAt = useRef( 0 );

	const { isPostPublished, isPublishingPost, postType, postId } = useSelect( select => {
		const editor = select( editorStore );
		return {
			isPostPublished: editor.isCurrentPostPublished(),
			isPublishingPost: editor.isPublishingPost(),
			postType: editor.getCurrentPostType(),
			postId: editor.getCurrentPostId(),
		};
	}, [] );
	const wasPublishingPost = usePrevious( isPublishingPost );
	const wasPostPublished = usePrevious( isPostPublished );

	useEffect( () => {
		if ( ! data || isClosedForSession ) {
			return;
		}

		if (
			postType === 'post' &&
			wasPublishingPost &&
			! isPublishingPost &&
			! wasPostPublished &&
			isPostPublished
		) {
			window.setTimeout( () => {
				openedAt.current = Date.now();
				setIsOpen( true );
				recordPromoEvent( 'wpcom_post_publish_podcast_promo_shown', {
					post_id: Number( postId ) || 0,
				} );
			} );
		}
	}, [
		data,
		isClosedForSession,
		isPostPublished,
		isPublishingPost,
		postId,
		postType,
		wasPostPublished,
		wasPublishingPost,
	] );

	const closeModal = useCallback(
		( force = false ) => {
			if ( ! force && Date.now() - openedAt.current < requestCloseGracePeriod ) {
				return;
			}

			recordPromoEvent( 'wpcom_post_publish_podcast_promo_dismissed', {
				post_id: Number( postId ) || 0,
				time_to_dismiss_ms: openedAt.current ? Date.now() - openedAt.current : 0,
			} );
			if ( data ) {
				apiFetch( { path: data.dismissPath, method: 'POST' } ).catch( () => {} );
			}
			setIsClosedForSession( true );
			setIsOpen( false );
		},
		[ data, postId ]
	);

	const handleRequestClose = useCallback( () => closeModal(), [ closeModal ] );

	const goToCreatePodcast = useCallback( () => {
		if ( ! data ) {
			return;
		}
		recordPromoEvent( 'wpcom_post_publish_podcast_promo_clicked', {
			post_id: Number( postId ) || 0,
			time_to_click_ms: openedAt.current ? Date.now() - openedAt.current : 0,
		} );
		apiFetch( { path: data.dismissPath, method: 'POST' } )
			.catch( () => {} )
			.finally( () => {
				( window.top || window ).location.href = data.createUrl;
			} );
	}, [ data, postId ] );

	if ( ! data || ! isOpen ) {
		return null;
	}

	return (
		<Modal
			className="jetpack-post-publish-podcast-promo-modal"
			title=""
			aria={ {
				labelledby: 'jetpack-post-publish-podcast-promo-modal-title',
			} }
			onRequestClose={ handleRequestClose }
		>
			<div className="jetpack-post-publish-podcast-promo-modal__hero">
				<svg
					className="jetpack-post-publish-podcast-promo-modal__soundwave"
					viewBox="0 0 320 96"
					preserveAspectRatio="none"
					aria-hidden="true"
					focusable="false"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect x="8" y="34" width="5" height="28" rx="2.5" />
					<rect x="24" y="26" width="5" height="44" rx="2.5" />
					<rect x="40" y="16" width="5" height="64" rx="2.5" />
					<rect x="56" y="30" width="5" height="36" rx="2.5" />
					<rect x="72" y="24" width="5" height="48" rx="2.5" />
					<rect x="88" y="34" width="5" height="28" rx="2.5" />
					<rect x="104" y="26" width="5" height="44" rx="2.5" />
					<rect x="120" y="30" width="5" height="36" rx="2.5" />
					<rect x="136" y="40" width="5" height="16" rx="2.5" />
					<rect x="179" y="40" width="5" height="16" rx="2.5" />
					<rect x="195" y="30" width="5" height="36" rx="2.5" />
					<rect x="211" y="26" width="5" height="44" rx="2.5" />
					<rect x="227" y="34" width="5" height="28" rx="2.5" />
					<rect x="243" y="24" width="5" height="48" rx="2.5" />
					<rect x="259" y="30" width="5" height="36" rx="2.5" />
					<rect x="275" y="16" width="5" height="64" rx="2.5" />
					<rect x="291" y="26" width="5" height="44" rx="2.5" />
					<rect x="307" y="34" width="5" height="28" rx="2.5" />
				</svg>
				<div className="jetpack-post-publish-podcast-promo-modal__hero-art" aria-hidden="true">
					<svg viewBox="0 0 64 64" width="88" height="88" xmlns="http://www.w3.org/2000/svg">
						<defs>
							<linearGradient
								id="jetpack-post-publish-podcast-promo-grad"
								x1="0"
								y1="0"
								x2="1"
								y2="1"
							>
								<stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
								<stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
							</linearGradient>
						</defs>
						<circle cx="32" cy="32" r="28" fill="url(#jetpack-post-publish-podcast-promo-grad)" />
						<path
							fill="#fff"
							d="M32 14a8 8 0 0 0-8 8v10a8 8 0 0 0 16 0V22a8 8 0 0 0-8-8zm-12 18a1.5 1.5 0 0 1 3 0 9 9 0 0 0 18 0 1.5 1.5 0 0 1 3 0 12 12 0 0 1-10.5 11.9V48h4.5v3h-12v-3H30v-2.1A12 12 0 0 1 20 32z"
						/>
					</svg>
				</div>
			</div>
			<div className="jetpack-post-publish-podcast-promo-modal__body">
				<h1
					id="jetpack-post-publish-podcast-promo-modal-title"
					className="jetpack-post-publish-podcast-promo-modal__title"
				>
					{ __( 'Your post is live. Ready for the podcast version?', 'jetpack-podcast' ) }
				</h1>
				<p className="jetpack-post-publish-podcast-promo-modal__description">
					{ __(
						'Give your audience another way to enjoy your content. Pick a date range or a few posts, and we’ll turn them into a two-host podcast episode.',
						'jetpack-podcast'
					) }
				</p>
				<div className="jetpack-post-publish-podcast-promo-modal__actions">
					<Button
						className="jetpack-post-publish-podcast-promo-modal__primary-action"
						variant="primary"
						onClick={ goToCreatePodcast }
					>
						{ __( 'Create podcast episode', 'jetpack-podcast' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
};

if ( ! getPlugin( 'jetpack-post-publish-podcast-promo' ) ) {
	registerPlugin( 'jetpack-post-publish-podcast-promo', {
		render: PostPublishPodcastPromo,
	} );
}
