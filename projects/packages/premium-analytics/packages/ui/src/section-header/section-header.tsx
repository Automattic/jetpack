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
 * slot for the date controls anchored on the right.
 *
 * @param {SectionHeaderProps} props - The props for the SectionHeader component.
 * @return The section header element.
 */
export function SectionHeader( { title, subtitle, children }: SectionHeaderProps ) {
	return (
		<Stack direction="row" align="flex-start" justify="space-between">
			<Stack direction="column" align="flex-start" justify="flex-start">
				<Text variant="heading-2xl" render={ <h2 /> }>
					{ title }
				</Text>
				{ subtitle ? <Text variant="body-md">{ subtitle }</Text> : null }
			</Stack>

			<Stack direction="row" align="center" justify="flex-end" className={ styles.controls }>
				{ children }
			</Stack>
		</Stack>
	);
}
