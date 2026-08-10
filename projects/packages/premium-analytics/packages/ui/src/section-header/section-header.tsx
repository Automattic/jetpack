import { Stack, Text } from '@jetpack-premium-analytics/externals';
import { ReactNode } from 'react';
import styles from './section-header.module.scss';

type SectionHeaderProps = {
	/**
	 * The name of the section.
	 */
	title: string;

	/**
	 * Subtitle describing the active date configuration. Omit it while the
	 * consumer has nothing to describe.
	 */
	subtitle?: string;

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
 * title wraps: the row it shares is gone, so nothing is left to truncate it
 * for. Measured by a container query rather than against the viewport.
 *
 * @param {SectionHeaderProps} props - The props for the SectionHeader component.
 * @return The section header element.
 */
export function SectionHeader( { title, subtitle, children }: SectionHeaderProps ) {
	return (
		<div className={ styles.container }>
			<div className={ styles.layout }>
				{ /* Titled with its own text, the only way back to a name the
				     ellipsis cut off. */ }
				<Text className={ styles.title } variant="heading-2xl" render={ <h2 title={ title } /> }>
					{ title }
				</Text>

				<Stack direction="row" align="center" className={ styles.controls }>
					{ children }
				</Stack>

				{ subtitle ? (
					<Text className={ styles.subtitle } variant="body-md">
						{ subtitle }
					</Text>
				) : null }
			</div>
		</div>
	);
}
