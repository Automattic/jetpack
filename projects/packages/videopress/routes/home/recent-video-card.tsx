import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useCopyToClipboard } from '@wordpress/compose';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Icon, video as videoIcon, copy as copyIcon } from '@wordpress/icons';
import { Badge, Button, Card, Stack, Text } from '@wordpress/ui';
import { useProcessingProgress } from '../../src/dashboard/hooks/use-processing-progress';
import { resolveEmbedSnippet, resolveShareLink } from './share-links';
import type { ViewsSlot } from './views-slot';
import type { LibraryItem, LibraryItemPrivacy } from '../../src/dashboard/types/library';
import type { ReactElement } from 'react';

const dateSettings = getDateSettings();
const NUMBER_FORMATTER = new Intl.NumberFormat();

const PRIVACY_LABELS: Record< LibraryItemPrivacy, string > = {
	public: __( 'Public', 'jetpack-videopress-pkg' ),
	private: __( 'Private', 'jetpack-videopress-pkg' ),
	'site-default': __( 'Site default', 'jetpack-videopress-pkg' ),
};

/**
 * Format a duration in seconds as `m:ss` / `h:mm:ss`. Local to the card rather
 * than pulled from `utils/format` because the badge wants the compact
 * unpadded-hours form, and a zero duration must render nothing at all: a
 * still-transcoding video reports `0`, and "0:00" would be a false claim about
 * its length.
 *
 * @param seconds - Duration in seconds.
 * @return The formatted duration, or null when it is not known.
 */
function formatDurationBadge( seconds: number ): string | null {
	if ( ! seconds || seconds <= 0 ) {
		return null;
	}
	const total = Math.floor( seconds );
	const h = Math.floor( total / 3600 );
	const m = Math.floor( ( total % 3600 ) / 60 );
	const s = total % 60;
	const pad = ( n: number ) => String( n ).padStart( 2, '0' );
	return h > 0 ? `${ h }:${ pad( m ) }:${ pad( s ) }` : `${ m }:${ pad( s ) }`;
}

/**
 * A small text button that copies a fixed string to the clipboard.
 *
 * Uses `@wordpress/compose`'s `useCopyToClipboard` (clipboard.js underneath)
 * rather than `navigator.clipboard`, which is undefined on the plain-HTTP
 * origins these dashboards are developed against. Mirrors the copy affordance
 * on the video details screen, including its snackbar confirmation.
 *
 * @param props            - Component props.
 * @param props.text       - The string written to the clipboard.
 * @param props.label      - Visible button label.
 * @param props.fieldLabel - Human-readable field name used in the snackbar.
 * @param props.ariaLabel  - Accessible name; disambiguates the button between cards.
 * @return The button element.
 */
function CopyButton( {
	text,
	label,
	fieldLabel,
	ariaLabel,
}: {
	text: string;
	label: string;
	fieldLabel: string;
	ariaLabel: string;
} ): ReactElement {
	const { createSuccessNotice } = useGlobalNotices();
	const ref = useCopyToClipboard( text, () =>
		createSuccessNotice(
			sprintf(
				/* translators: %s: name of the copied field, e.g. "Video link". */
				__( '%s copied to clipboard.', 'jetpack-videopress-pkg' ),
				fieldLabel
			)
		)
	);

	return (
		<Button
			ref={ ref }
			variant="minimal"
			tone="neutral"
			size="compact"
			aria-label={ ariaLabel }
			className="vp-home__card-action"
		>
			<Button.Icon icon={ copyIcon } />
			{ label }
		</Button>
	);
}

type Props = {
	item: LibraryItem;
	/** What the "how is this doing?" slot is allowed to claim. See views-slot.ts. */
	viewsSlot: ViewsSlot;
	/** Views for this video; only ever read when `viewsSlot` is `views`. */
	views?: number;
	/** Opens the video details screen. */
	onOpen: ( id: string ) => void;
};

/**
 * One card in Home's recents rail.
 *
 * Everything above the fold is a fact the dashboard can always establish from
 * `/wp/v2/media` alone — thumbnail, title, duration, upload date, privacy,
 * processing state — so the card is fully truthful on a site with no
 * WordPress.com connection and no stats. Only the single performance slot
 * depends on the stats proxy, and it refuses to render a number it cannot
 * stand behind (see `resolveViewsSlot`); when it can't, the row is an action
 * instead.
 *
 * @param props           - Component props.
 * @param props.item      - The video.
 * @param props.viewsSlot - Which performance treatment is permitted.
 * @param props.views     - Views for this video, when known.
 * @param props.onOpen    - Opens the video details screen.
 * @return The card element.
 */
export default function RecentVideoCard( { item, viewsSlot, views, onOpen }: Props ): ReactElement {
	const processingProgress = useProcessingProgress(
		item.guid,
		item.isPrivate,
		item.type === 'videopress' && item.isProcessing
	);
	const duration = formatDurationBadge( item.durationSeconds );
	const shareLink = resolveShareLink( item );
	const embedSnippet = resolveEmbedSnippet( item );
	const title = item.title || item.filename || __( 'Untitled video', 'jetpack-videopress-pkg' );

	return (
		<Card.Root className="vp-home__card">
			<div className="vp-home__card-media">
				{ item.thumbnailUrl && ! item.isProcessing ? (
					// Decorative: the title beneath is the accessible name of the
					// card, so an alt repeating it would be announced twice.
					<img src={ item.thumbnailUrl } alt="" className="vp-home__card-thumb" />
				) : (
					<span className="vp-home__card-thumb vp-home__card-thumb--placeholder">
						<Icon icon={ videoIcon } size={ 28 } />
					</span>
				) }
				{ item.isProcessing ? (
					<span className="vp-home__card-pill vp-home__card-pill--processing">
						{ processingProgress !== null
							? sprintf(
									/* translators: %d: transcoding progress percentage. */
									__( 'Processing %d%%', 'jetpack-videopress-pkg' ),
									processingProgress
							  )
							: __( 'Processing', 'jetpack-videopress-pkg' ) }
					</span>
				) : (
					duration && <span className="vp-home__card-pill">{ duration }</span>
				) }
			</div>

			<div className="vp-home__card-body">
				<Button
					variant="unstyled"
					className="vp-home__card-title"
					onClick={ () => onOpen( item.id ) }
				>
					{ title }
				</Button>

				<Stack direction="row" gap="sm" align="center" className="vp-home__card-meta">
					{ item.uploadDate && (
						<Text variant="body-sm" className="vp-home__card-date">
							{ dateI18n( dateSettings.formats.date, item.uploadDate ) }
						</Text>
					) }
					<Badge intent={ item.privacy === 'private' ? 'draft' : 'none' }>
						{ PRIVACY_LABELS[ item.privacy ] }
					</Badge>
				</Stack>

				{ /*
				 * The performance slot. `views` renders a figure; every other
				 * outcome renders an action instead of a number — and `unknown`
				 * says nothing at all, because "No plays yet" is itself a claim
				 * we can only make when the stats request actually came back.
				 */ }
				<div className="vp-home__card-performance">
					{ viewsSlot === 'views' && views !== undefined && (
						<Text variant="body-sm" className="vp-home__card-views">
							{ sprintf(
								/* translators: %s: formatted number of views. */
								_n( '%s view', '%s views', views, 'jetpack-videopress-pkg' ),
								NUMBER_FORMATTER.format( views )
							) }
						</Text>
					) }
					{ viewsSlot === 'no-plays' && (
						<Text variant="body-sm" className="vp-home__card-no-plays">
							{ __( 'No plays yet', 'jetpack-videopress-pkg' ) }
						</Text>
					) }
				</div>

				<Stack direction="row" gap="sm" align="center" className="vp-home__card-actions">
					{ shareLink && (
						<CopyButton
							text={ shareLink }
							label={ __( 'Copy link', 'jetpack-videopress-pkg' ) }
							fieldLabel={ __( 'Video link', 'jetpack-videopress-pkg' ) }
							ariaLabel={ sprintf(
								/* translators: %s: video title. */
								__( 'Copy link to “%s”', 'jetpack-videopress-pkg' ),
								title
							) }
						/>
					) }
					{ /*
					 * Only VideoPress-hosted videos have a shortcode; a local
					 * attachment has nothing to embed, so the button is absent
					 * rather than present-and-inert.
					 */ }
					{ embedSnippet && (
						<CopyButton
							text={ embedSnippet }
							label={ __( 'Copy embed', 'jetpack-videopress-pkg' ) }
							fieldLabel={ __( 'Embed code', 'jetpack-videopress-pkg' ) }
							ariaLabel={ sprintf(
								/* translators: %s: video title. */
								__( 'Copy embed code for “%s”', 'jetpack-videopress-pkg' ),
								title
							) }
						/>
					) }
				</Stack>
			</div>
		</Card.Root>
	);
}
