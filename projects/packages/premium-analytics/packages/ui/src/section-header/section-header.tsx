import { Stack, Text } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
import { ReactNode } from 'react';
import styles from './section-header.module.scss';

type SectionHeaderProps = {
	title: string;

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
};

/**
 * Section header for an analytics surface: title and date controls share one
 * row (title truncates, controls keep natural width). Below a container-query
 * width the two stack and the title wraps.
 *
 * @param {SectionHeaderProps} props - The props for the SectionHeader component.
 * @return The section header element.
 */
export function SectionHeader( { title, condenseOnScroll = false, children }: SectionHeaderProps ) {
	return (
		<div className={ clsx( styles.container, condenseOnScroll && styles.condensing ) }>
			<div className={ styles.layout }>
				{ /* The `title` attribute is the only way back to a name the
				     ellipsis cut off. */ }
				<Text className={ styles.title } variant="heading-2xl" render={ <h2 title={ title } /> }>
					{ title }
				</Text>

				{ children ? (
					<Stack direction="row" align="center" className={ styles.controls }>
						{ children }
					</Stack>
				) : null }
			</div>
		</div>
	);
}
