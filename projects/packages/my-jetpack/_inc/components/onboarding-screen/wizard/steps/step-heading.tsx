import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import styles from '../styles.module.scss';

type StepHeadingProps = {
	// Owned by the wizard so the panel region can be labelled by the heading.
	titleId: string;
	title: string;
	description: string;
};

/**
 * A step's heading and the line under it, arriving in the first two waves.
 *
 * @param props             - The component props.
 * @param props.titleId     - The id the panel region is labelled by.
 * @param props.title       - The step heading.
 * @param props.description - The line under the heading.
 * @return The rendered heading.
 */
export function StepHeading( { titleId, title, description }: StepHeadingProps ) {
	return (
		<Stack direction="column" gap="sm">
			<Text
				variant="heading-2xl"
				id={ titleId }
				render={ <h1 /> }
				className={ clsx( styles[ 'step-title' ], styles.wave, styles[ 'wave-1' ] ) }
			>
				{ title }
			</Text>
			<Text
				variant="body-lg"
				render={ <p /> }
				className={ clsx( styles[ 'step-description' ], styles.wave, styles[ 'wave-2' ] ) }
			>
				{ description }
			</Text>
		</Stack>
	);
}
