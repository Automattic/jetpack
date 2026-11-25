import { useCopyToClipboard } from '@wordpress/compose';
import { Button, Stack, Text } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import styles from '../styles.module.scss';
import { getGuideText } from './copy';
import FactList from './fact-list';
import type { CopyContext, ResultCopy } from './copy';
import type { ReactNode, Ref } from 'react';

/**
 * A message to send someone, with a button that copies it.
 *
 * @param {object}      props         - Component props.
 * @param {object}      props.message - The label and the text.
 * @param {CopyContext} props.copy    - The copy context.
 * @return {ReactNode} The message.
 */
function CopyableMessage( {
	message,
	copy,
}: {
	message: NonNullable< ResultCopy[ 'message' ] >;
	copy: CopyContext;
} ): ReactNode {
	const text = getGuideText( copy );
	const [ isCopied, setIsCopied ] = useState( false );

	const onCopied = useCallback( () => setIsCopied( true ), [] );
	const copyRef = useCopyToClipboard< HTMLButtonElement >( message.text, onCopied );

	return (
		<Stack direction="column" gap="sm" className={ styles.note }>
			<Text variant="body-sm" className={ styles.hint }>
				{ message.label }
			</Text>
			<Text variant="body-md" render={ <p /> }>
				{ message.text }
			</Text>
			<Stack direction="row" gap="sm" align="center">
				<Button ref={ copyRef } variant="outline" size="compact">
					{ text.copyMessage }
				</Button>
				<Text variant="body-sm" role="status">
					{ isCopied ? text.copied : '' }
				</Text>
			</Stack>
		</Stack>
	);
}

interface ResultStepProps {
	result: ResultCopy;
	copy: CopyContext;
	/** Receives the heading, which takes focus when the step changes. */
	headingRef: Ref< HTMLHeadingElement >;
}

/**
 * A result, or the statement the guide reached: what it means, and what to do next.
 *
 * @param {ResultStepProps} props - Component props.
 * @return {ReactNode} The step.
 */
export default function ResultStep( { result, copy, headingRef }: ResultStepProps ): ReactNode {
	return (
		<Stack direction="column" gap="sm">
			{ result.lead && (
				<Text variant="body-sm" render={ <p /> } className={ styles.hint }>
					{ result.lead }
				</Text>
			) }
			<Text
				variant="heading-md"
				render={ <h3 ref={ headingRef } tabIndex={ -1 } /> }
				className={ styles.question }
			>
				{ result.title }
			</Text>
			{ result.help && (
				<Text variant="body-md" render={ <p /> } className={ styles.prose }>
					{ result.help }
				</Text>
			) }
			<FactList facts={ result.facts } />
			{ result.fixes && (
				<>
					<Text variant="body-md" render={ <p /> }>
						{ result.fixes.lead }
					</Text>
					<ol className={ styles.list }>
						{ result.fixes.items.map( ( fix, index ) => (
							<Text key={ index } variant="body-md" render={ <li /> } className={ styles.prose }>
								{ fix }
							</Text>
						) ) }
					</ol>
				</>
			) }
			{ result.more && (
				<Text variant="body-md" render={ <p /> } className={ styles.prose }>
					{ result.more }
				</Text>
			) }
			{ result.message && <CopyableMessage message={ result.message } copy={ copy } /> }
		</Stack>
	);
}
