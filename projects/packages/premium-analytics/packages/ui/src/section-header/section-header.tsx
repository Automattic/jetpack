import { Stack, Text } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
import { ReactNode, Ref } from 'react';
import styles from './section-header.module.scss';

export type SectionHeaderProps = {
	/** Required: a surface that cannot name itself has no heading for the page. */
	title: ReactNode;

	/**
	 * The heading element the title renders as. Detail pages name their
	 * resource, so the title is the page's `h1`; the dashboard and the report
	 * pages title a section within one.
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
	 * Condenses into a compact bar once it pins: the title drops a type-scale
	 * step. Requires the surface to publish a `--section-header-pin` view
	 * timeline; falls back to resting layout without it.
	 */
	condenseOnScroll?: boolean;

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
 * @param {SectionHeaderProps} props - The props for the SectionHeader component.
 * @return The section header element.
 */
export function SectionHeader( {
	title,
	headingLevel = 2,
	visual,
	subTitle,
	busy = false,
	condenseOnScroll = false,
	children,
	controlsRef,
}: SectionHeaderProps ) {
	const HeadingTag = `h${ headingLevel }` as const;

	return (
		<div className={ clsx( styles.container, condenseOnScroll && styles.condensing ) }>
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

					{ /* A div, not a p: the slot takes whatever the surface has, including
					     the block-level skeleton it shows while the resource resolves. */ }
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
		</div>
	);
}
