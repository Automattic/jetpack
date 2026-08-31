/**
 * Assistant announcement banner — dark-green callout at the top of the
 * Overview tab. Dismissal is per-user via the preferences store: core's
 * inline bootstrap on the wp-preferences script handle (which this bundle's
 * DependencyExtraction externalizes to) preloads the user's
 * persisted_preferences meta and wires the persistence layer, so reads are
 * flash-free and writes sync across the user's devices with no wiring here.
 * The layer debounces writes — a dismiss followed by instantly leaving the
 * page can lose the write, in which case the banner just shows once more.
 */

import { Button, Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import {
	chevronLeft,
	chevronRight,
	close,
	commentContent,
	connection,
	Icon,
	image,
	pencil,
	postCommentsForm,
	title,
} from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import analytics from 'lib/analytics';

import './style.scss';

const PREFERENCE_SCOPE = 'jetpack/ai';
const PREFERENCE_NAME = 'assistantBannerDismissed';

// Things you can do with Jetpack AI, shown in the banner's carousel. Cards
// with a `videoUrl` get a "Watch video" CTA that opens the demo in a popup
// (the embeds are the same VideoPress videos the My Jetpack AI product page
// uses); cards with an `href`/`cta` link out instead.
// Exported for the tests, which drive their assertions off this list.
export const CAPABILITIES = [
	{
		key: 'generate-images',
		icon: image,
		label: __( 'Generate and edit professional quality images.', 'jetpack' ),
		videoUrl:
			'https://videopress.com/embed/HJCf8cXc?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fone-click-featured-images.png%3Fw%3D560',
	},
	{
		key: 'generate-content',
		icon: pencil,
		label: __( 'Generate and edit your engaging and SEO optimized content.', 'jetpack' ),
		videoUrl:
			'https://videopress.com/embed/GdXmtVtW?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fimage-37.png%3Fw%3D560',
	},
	{
		key: 'connect-agents',
		icon: connection,
		label: __( 'Connect your Claude or ChatGPT to your website.', 'jetpack' ),
		cta: __( 'Connect your agent', 'jetpack' ),
		href: '#/mcp',
	},
	{
		key: 'content-feedback',
		icon: commentContent,
		label: __( 'Get feedback on your content before you publish.', 'jetpack' ),
		videoUrl:
			'https://videopress.com/embed/0vb0OJm7?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fimage-39.png%3Fw%3D560',
	},
	{
		key: 'build-forms',
		icon: postCommentsForm,
		label: __( 'Build contact and signup forms using prompts.', 'jetpack' ),
		videoUrl:
			'https://videopress.com/embed/OMI3zqid?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fimage-38.png%3Fw%3D560',
	},
	{
		key: 'optimize-titles',
		icon: title,
		label: __( 'Optimize your titles for engagement and SEO.', 'jetpack' ),
		videoUrl:
			'https://videopress.com/embed/xjy2weWj?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F06%2Fjetpack-ai-title-optimization.png%3Fw%3D560',
	},
];

/**
 * Audience properties per the AI-product Tracks standards, encoded as
 * 'true'/'false' strings — same shape as mcp/tracks.js, which is documented
 * as jetpack_mcp_*-only and so not reused here.
 *
 * @return {object} Tracks audience properties.
 */
function getAudienceProps() {
	const { isA11n = false, isTest = false } = window?.jetpackAiSettings ?? {};
	return {
		is_a11n: isA11n ? 'true' : 'false',
		is_test: isTest ? 'true' : 'false',
	};
}

/**
 * The mock's mark: the Jetpack circle-and-bolt recolored — an accent-colored
 * disc (fill set in the stylesheet, keyed to the accent custom property) with
 * the glyph "cut out" by painting it in the banner's base indigo (a solid
 * approximation, since the aurora backdrop is a gradient).
 * jetpack-components' JetpackIcon hardcodes white polygons, so the same
 * geometry is inlined here.
 *
 * @return {object} Component markup.
 */
function AiLogoMark() {
	return (
		<svg
			className="jetpack-ai-overview-banner__logo"
			viewBox="0 0 32 32"
			width="20"
			height="20"
			aria-hidden="true"
			focusable="false"
		>
			<path d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z" />
			<polygon fill="#0b0d33" points="15,19 7,19 15,3" />
			<polygon fill="#0b0d33" points="17,29 17,13 25,13" />
		</svg>
	);
}

/**
 * Capability carousel: a scroll-snapping row of things-you-can-do cards
 * steered by round previous/next buttons. The row itself scrolls (touch,
 * trackpad, scroll-wheel all work); the buttons page it one card at a time
 * and disable at either end. Each card's CTA opens its demo video in a popup.
 *
 * @return {object} Component markup.
 */
function CapabilityCarousel() {
	const listRef = useRef( null );
	const [ canPrev, setCanPrev ] = useState( false );
	const [ canNext, setCanNext ] = useState( false );
	const [ activeVideo, setActiveVideo ] = useState( null );

	const openVideo = useCallback( capability => {
		setActiveVideo( capability );
		analytics.tracks.recordEvent( 'jetpack_ai_hub_assistant_banner_video_open', {
			video: capability.key,
			...getAudienceProps(),
		} );
	}, [] );

	const updateArrows = useCallback( () => {
		const list = listRef.current;
		if ( ! list ) {
			return;
		}
		const maxScroll = list.scrollWidth - list.clientWidth;
		// In RTL, scrollLeft runs from 0 down to -maxScroll; the magnitude is
		// the travelled distance either way. The 1px slack absorbs subpixel
		// rounding at the ends.
		const travelled = Math.abs( list.scrollLeft );
		setCanPrev( travelled > 1 );
		setCanNext( travelled < maxScroll - 1 );
	}, [] );

	useEffect( () => {
		updateArrows();
		// Re-derive the arrow states when the row is resized (window resize,
		// sidebar collapse). Absent in jsdom, where nothing can scroll anyway.
		if ( typeof ResizeObserver === 'undefined' || ! listRef.current ) {
			return;
		}
		const observer = new ResizeObserver( updateArrows );
		observer.observe( listRef.current );
		return () => observer.disconnect();
	}, [ updateArrows ] );

	const scrollByCard = useCallback( direction => {
		const list = listRef.current;
		if ( ! list ) {
			return;
		}
		// The offset between the first two cards is one card plus the gap, and
		// it comes out negative in RTL — which is exactly the sign scrollBy
		// needs there, so no direction juggling.
		const step =
			list.children.length > 1
				? list.children[ 1 ].offsetLeft - list.children[ 0 ].offsetLeft
				: list.clientWidth;
		list.scrollBy( { left: step * direction, behavior: 'smooth' } );
	}, [] );

	return (
		<div className="jetpack-ai-overview-banner__carousel">
			<div className="jetpack-ai-overview-banner__carousel-nav">
				<Button
					className="jetpack-ai-overview-banner__carousel-arrow"
					icon={ isRTL() ? chevronRight : chevronLeft }
					label={ __( 'Previous', 'jetpack' ) }
					onClick={ () => scrollByCard( -1 ) }
					disabled={ ! canPrev }
					accessibleWhenDisabled
				/>
				<Button
					className="jetpack-ai-overview-banner__carousel-arrow"
					icon={ isRTL() ? chevronLeft : chevronRight }
					label={ __( 'Next', 'jetpack' ) }
					onClick={ () => scrollByCard( 1 ) }
					disabled={ ! canNext }
					accessibleWhenDisabled
				/>
			</div>
			<ul className="jetpack-ai-overview-banner__cards" ref={ listRef } onScroll={ updateArrows }>
				{ CAPABILITIES.map( capability => {
					const ctaContent = (
						<>
							{ capability.href ? capability.cta : __( 'Watch video', 'jetpack' ) }
							<Icon icon={ isRTL() ? chevronLeft : chevronRight } size={ 16 } />
						</>
					);
					return (
						<li className="jetpack-ai-overview-banner__card" key={ capability.key }>
							<Icon
								className="jetpack-ai-overview-banner__card-icon"
								icon={ capability.icon }
								size={ 24 }
							/>
							<span className="jetpack-ai-overview-banner__card-text">{ capability.label }</span>
							{ capability.href ? (
								<a className="jetpack-ai-overview-banner__card-cta" href={ capability.href }>
									{ ctaContent }
								</a>
							) : (
								<button
									type="button"
									className="jetpack-ai-overview-banner__card-cta"
									onClick={ () => openVideo( capability ) }
								>
									{ ctaContent }
								</button>
							) }
						</li>
					);
				} ) }
			</ul>
			{ activeVideo && (
				<Modal
					title={ activeVideo.label }
					onRequestClose={ () => setActiveVideo( null ) }
					className="jetpack-ai-overview-banner__video-modal"
				>
					<div className="jetpack-ai-overview-banner__video-frame">
						<iframe
							src={ activeVideo.videoUrl }
							title={ activeVideo.label }
							allowFullScreen
							allow="clipboard-write"
						/>
					</div>
				</Modal>
			) }
		</div>
	);
}

/**
 * Dismissible assistant announcement banner.
 *
 * @return {object|null} Component markup, or null once dismissed.
 */
export default function AssistantBanner() {
	const dismissed = useSelect(
		select => select( preferencesStore ).get( PREFERENCE_SCOPE, PREFERENCE_NAME ),
		[]
	);
	const { set } = useDispatch( preferencesStore );

	const handleDismiss = useCallback( () => {
		// The store updates synchronously (banner hides at once); the layer
		// persists in the background.
		set( PREFERENCE_SCOPE, PREFERENCE_NAME, true );
		analytics.tracks.recordEvent( 'jetpack_ai_hub_assistant_banner_dismiss', getAudienceProps() );
	}, [ set ] );

	if ( dismissed ) {
		return null;
	}

	return (
		<div className="jetpack-ai-overview-banner">
			<div className="jetpack-ai-overview-banner__intro">
				<AiLogoMark />
				<div className="jetpack-ai-overview-banner__intro-text">
					<h2 className="jetpack-ai-overview-banner__title">
						{ __( 'Your site now has an assistant.', 'jetpack' ) }
					</h2>
					<p className="jetpack-ai-overview-banner__description">
						{ __(
							'Turn your ideas into ready-to-publish content at lightspeed. Make changes across your site using ChatGPT, Claude, Slack, or right here.',
							'jetpack'
						) }
					</p>
				</div>
			</div>
			<CapabilityCarousel />
			<Button
				className="jetpack-ai-overview-banner__dismiss"
				icon={ close }
				label={ __( 'Dismiss', 'jetpack' ) }
				onClick={ handleDismiss }
			/>
		</div>
	);
}
