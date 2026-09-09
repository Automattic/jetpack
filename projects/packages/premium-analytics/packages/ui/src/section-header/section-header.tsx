import { Stack, Text } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
import { forwardRef, ForwardedRef, ReactNode, Ref } from 'react';
import styles from './section-header.module.scss';

export type SectionHeaderProps = {
	/** Required: a surface that cannot name itself has no heading for the page. */
	title: ReactNode;

	/**
	 * The heading element the title renders as. The page's `h1` is the
	 * breadcrumb's trailing crumb, so every surface titles a section under it.
	 */
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;

	/**
	 * Decorative mark before the title: a thumbnail, a poster, a type icon. The
	 * slot owns the box and hides it from the accessibility tree, so pass an
	 * `<img>` with `alt=""` or a bare icon, never interactive content or text
	 * the title does not already carry.
	 */
	visual?: ReactNode;

	/** A line under the title: what the resource is, what window it reports over. */
	subTitle?: ReactNode;

	/** Marks the text cell as updating while the surface resolves its title. */
	busy?: boolean;

	/**
	 * Pins the header at the top of the surface's scroll container and
	 * condenses it once pinned: a sticky band in the page header's fill,
	 * spanning the page gutter on its own. The surface declares
	 * `timeline-scope: --section-header-pin` on the header's parent, which
	 * must span the content that scrolls under the band.
	 */
	pinned?: boolean;

	/**
	 * Rendered under the header row. Pinned, it stays inside the band, so its
	 * actions remain reachable however far the reader has scrolled. May
	 * render nothing.
	 */
	notice?: ReactNode;

	/**
	 * Date controls anchored to the end of the header row. Left out, the cell is
	 * not rendered: an empty one costs a band of space in the stacked layout.
	 */
	children?: ReactNode;

	/** Reaches the controls cell, for a spotlight to anchor on. */
	controlsRef?: Ref< HTMLDivElement >;
};

/**
 * Header for an analytics surface: an optional visual, the title and its
 * subtitle, and the date controls share one row. Below a container-query width
 * the controls take their own row and the title wraps.
 *
 * The ref reaches the header's root: the row a date control measures the room
 * it has against.
 *
 * @param {SectionHeaderProps}  props - The props for the SectionHeader component.
 * @param {Ref<HTMLDivElement>} ref   - Forwarded to the header's root element.
 * @return The section header element.
 */
function UnforwardedSectionHeader(
	{
		title,
		headingLevel = 2,
		visual,
		subTitle,
		busy = false,
		pinned = false,
		notice,
		children,
		controlsRef,
	}: SectionHeaderProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	const HeadingTag = `h${ headingLevel }` as const;

	const header = (
		<div ref={ ref } className={ clsx( styles.container, pinned && styles.pinned ) }>
			<div className={ clsx( styles.layout, visual && styles.withVisual ) }>
				{ visual ? (
					<div className={ styles.visual } aria-hidden="true">
						{ visual }
					</div>
				) : null }

				<div className={ styles.text } aria-busy={ busy || undefined }>
					{ /* The `title` attribute is the only way back to a name the
					     ellipsis cut off, and only a string can supply one. */ }
					<Text
						className={ styles.title }
						variant="heading-2xl"
						render={ <HeadingTag title={ typeof title === 'string' ? title : undefined } /> }
					>
						{ title }
					</Text>

					{ subTitle ? (
						<Text className={ styles.subTitle } variant="body-sm" render={ <div /> }>
							{ subTitle }
						</Text>
					) : null }
				</div>

				{ children ? (
					<Stack ref={ controlsRef } direction="row" align="center" className={ styles.controls }>
						{ children }
					</Stack>
				) : null }
			</div>

			{ notice ? <div className={ styles.notice }>{ notice }</div> : null }
		</div>
	);

	if ( ! pinned ) {
		return header;
	}

	return (
		<>
			{ /* Marks where the header comes to rest, so the condense starts
			     there. Measured, never seen. */ }
			<div className={ styles.pinMarker } aria-hidden="true" />
			{ header }
		</>
	);
}

export const SectionHeader = forwardRef( UnforwardedSectionHeader );
