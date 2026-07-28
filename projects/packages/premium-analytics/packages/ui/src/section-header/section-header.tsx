import { Stack, Text } from '@wordpress/ui';
import { ReactNode } from 'react';

type SectionHeaderProps = {
	/**
	 * The name of the section.
	 */
	title: string;

	/**
	 * The subtitle of the section.
	 */
	subtitle: string;

	/**
	 * The children of the section.
	 */
	children?: ReactNode;
};

/**
 * ...
 * @param {SectionHeaderProps} props - The props for the SectionHeader component.
 * @return The section tab bar element.
 */
export function SectionHeader( { title, subtitle, children }: SectionHeaderProps ) {
	return (
		<Stack direction="row" align="flex-start" justify="space-between">
			<Stack direction="column" align="flex-start" justify="flex-start">
				<Text variant="heading-2xl" render={ <h2 /> }>
					{ title }
				</Text>
				<Text variant="body-lg">{ subtitle }</Text>
			</Stack>

			<Stack direction="row" align="center" justify="flex-end">
				{ children }
			</Stack>
		</Stack>
	);
}
