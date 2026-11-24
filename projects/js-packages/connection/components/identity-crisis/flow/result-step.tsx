import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import styles from '../styles.module.scss';
import type { ResultCopy } from './copy';
import type { ReactNode, Ref } from 'react';

interface ResultStepProps {
	copy: ResultCopy;
	/** Receives the heading, which takes focus when the step changes. */
	headingRef: Ref< HTMLHeadingElement >;
}

/**
 * A result: why it happened, what the screen can tell, and the ways to fix it.
 *
 * @param {ResultStepProps} props - Component props.
 * @return {ReactNode} The step.
 */
export default function ResultStep( { copy, headingRef }: ResultStepProps ): ReactNode {
	return (
		<Stack direction="column" gap="sm">
			<Text variant="heading-md" render={ <h3 ref={ headingRef } tabIndex={ -1 } /> }>
				{ copy.title }
			</Text>
			<Text variant="body-md" render={ <p /> } className={ styles.prose }>
				{ copy.help }
			</Text>
			{ copy.facts.length > 0 && (
				<ul
					className={ styles.facts }
					aria-label={ __( 'What we already know', 'jetpack-connection-js' ) }
				>
					{ copy.facts.map( ( fact, index ) => (
						<Text key={ index } variant="body-sm" render={ <li /> }>
							{ fact }
						</Text>
					) ) }
				</ul>
			) }
			<Text variant="body-md" render={ <p /> }>
				{ copy.fixesLead }
			</Text>
			<ol className={ styles.list }>
				{ copy.fixes.map( ( fix, index ) => (
					<Text key={ index } variant="body-md" render={ <li /> } className={ styles.prose }>
						{ fix }
					</Text>
				) ) }
			</ol>
		</Stack>
	);
}
