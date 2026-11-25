import { Field, Fieldset, Radio, RadioGroup, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useId } from 'react';
import styles from '../styles.module.scss';
import { getOptionCopy, getStepTitle } from './copy';
import type { CopyContext } from './copy';
import type { ChoiceStepId, Option, OptionId } from './steps';
import type { ReactNode, Ref } from 'react';

interface ChoiceStepProps {
	step: ChoiceStepId;
	options: Option[];
	pick: OptionId | null;
	copy: CopyContext;
	disabled: boolean;
	onPick: ( option: OptionId ) => void;
	/** Receives the question, which takes focus when the step changes. */
	legendRef: Ref< HTMLDivElement >;
}

/**
 * A question and its answers; the selected answer shows what it will do.
 *
 * @param {ChoiceStepProps} props - Component props.
 * @return {ReactNode} The step.
 */
export default function ChoiceStep( {
	step,
	options,
	pick,
	copy,
	disabled,
	onPick,
	legendRef,
}: ChoiceStepProps ): ReactNode {
	const id = useId();

	const handleChange = useCallback(
		( value: unknown ) => {
			const option = options.find( candidate => candidate.id === value );
			if ( option ) {
				onPick( option.id );
			}
		},
		[ options, onPick ]
	);

	return (
		<Field.Root name={ `${ id }-pick` }>
			<Fieldset.Root
				render={
					<RadioGroup value={ pick } onValueChange={ handleChange } disabled={ disabled } />
				}
			>
				<Stack direction="column" gap="sm">
					<Fieldset.Legend
						ref={ legendRef }
						tabIndex={ -1 }
						render={ <Text variant="heading-md" /> }
					>
						{ getStepTitle( step, copy ) }
					</Fieldset.Legend>
					{ options.map( option => {
						const text = getOptionCopy( option.id, copy );
						const isSelected = option.id === pick;
						const hintId = `${ id }-${ option.id }`;
						return (
							<Field.Item
								key={ option.id }
								render={
									<div
										className={ clsx( styles.choice, isSelected && styles[ 'choice--selected' ] ) }
									/>
								}
							>
								<Radio value={ option.id } aria-describedby={ hintId } />
								<Stack direction="column" gap="xs">
									<Field.Label variant="plain">{ text.label }</Field.Label>
									<Text variant="body-sm" id={ hintId } className={ styles.hint }>
										{ text.hint }
									</Text>
									{ isSelected && text.more && <Text variant="body-sm">{ text.more }</Text> }
								</Stack>
							</Field.Item>
						);
					} ) }
				</Stack>
			</Fieldset.Root>
		</Field.Root>
	);
}
