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
 * Two-halves section header: title plus optional subtitle on the left, and a
 * slot for the date controls anchored on the right. The two halves stack once
 * the header itself is too narrow to hold them side by side, measured by a
 * container query rather than against the viewport.
 *
 * @param {SectionHeaderProps} props - The props for the SectionHeader component.
 * @return The section header element.
 */
export function SectionHeader( { title, subtitle, children }: SectionHeaderProps ) {
	return (
		<div className={ styles.container }>
			<div className={ styles.layout }>
				<Stack direction="column" align="flex-start" justify="flex-start">
					<Text variant="heading-2xl" render={ <h2 /> }>
						{ title }
					</Text>
					{ subtitle ? <Text variant="body-md">{ subtitle }</Text> : null }
				</Stack>

				{ /* Anchored from the stylesheet, not from `justify`, so the
				     container query can flip it when the halves stack. */ }
				<Stack direction="row" align="center" className={ styles.controls }>
					{ children }
				</Stack>
			</div>
		</div>
	);
}
