import { Stack, Text } from '@wordpress/ui';
import styles from '../styles.module.scss';
import { getGuideText } from './copy';
import type { CopyContext, OptionCopy } from './copy';
import type { ReactNode, Ref } from 'react';

interface ConclusionStepProps {
	/** The statement the guide reached. */
	option: OptionCopy;
	copy: CopyContext;
	/** Receives the statement, which takes focus when the step changes. */
	headingRef: Ref< HTMLHeadingElement >;
}

/**
 * The statement the guide reached and what it will do, for the admin to confirm.
 *
 * @param {ConclusionStepProps} props - Component props.
 * @return {ReactNode} The step.
 */
export default function ConclusionStep( {
	option,
	copy,
	headingRef,
}: ConclusionStepProps ): ReactNode {
	return (
		<Stack direction="column" gap="xs">
			<Text variant="body-sm" render={ <p /> } className={ styles.hint }>
				{ getGuideText( copy ).conclusionLead }
			</Text>
			<Text
				variant="heading-md"
				render={ <h3 ref={ headingRef } tabIndex={ -1 } /> }
				className={ styles.question }
			>
				{ option.statement ?? option.label }
			</Text>
			{ option.more && (
				<Text variant="body-md" render={ <p /> } className={ styles.prose }>
					{ option.more }
				</Text>
			) }
		</Stack>
	);
}
