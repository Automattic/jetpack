import { Stack, Text } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
import { ReactNode } from 'react';
import styles from './section-header.module.scss';

type SectionHeaderProps = {
	title: string;

	/**
	 * Subtitle describing the active date configuration. Omit it while the
	 * consumer has nothing to describe.
	 */
	subtitle?: string;

	/**
	 * Condenses the header into a compact bar once it pins: the subtitle fades
	 * out and gives its row back, and the title drops a step on the type
	 * scale. Only for surfaces that pin this header, and the surface must also
	 * publish a `--section-header-pin` view timeline marking where it pins
	 * (see the dashboard's pin marker in `routes/dashboard/stage.module.scss`).
	 * Without that timeline, or without browser support for it, the header
	 * keeps its resting layout.
	 */
	condenseOnScroll?: boolean;

	/**
	 * Date controls anchored to the end of the header row.
	 */
	children?: ReactNode;
};

/**
 * Section header for an analytics surface. The title and a slot for the date
 * controls share the first row, anchored to opposite edges: the controls keep
 * their natural width and a long title truncates with an ellipsis. The
 * subtitle takes a row of its own below them, so its length never costs the
 * controls width either.
 *
 * Once the header is too narrow to hold those two side by side everything
 * stacks, the subtitle returns to its place directly under the title, and the
 * title wraps rather than truncating. Measured by a container query rather
 * than against the viewport.
 *
 * @param {SectionHeaderProps} props - The props for the SectionHeader component.
 * @return The section header element.
 */
export function SectionHeader( {
	title,
	subtitle,
	condenseOnScroll = false,
	children,
}: SectionHeaderProps ) {
	return (
		<div className={ clsx( styles.container, condenseOnScroll && styles.condensing ) }>
			<div className={ styles.layout }>
				{ /* The `title` attribute is the only way back to a name the
				     ellipsis cut off. */ }
				<Text className={ styles.title } variant="heading-2xl" render={ <h2 title={ title } /> }>
					{ title }
				</Text>

				<Stack direction="row" align="center" className={ styles.controls }>
					{ children }
				</Stack>

				{ subtitle ? (
					<div className={ styles.subtitleRow }>
						<Text className={ styles.subtitle } variant="body-md">
							{ subtitle }
						</Text>
					</div>
				) : null }
			</div>
		</div>
	);
}
