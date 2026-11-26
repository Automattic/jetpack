import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useId } from 'react';
import styles from '../styles.module.scss';
import { getOptionCopy, getStepTitle } from './copy';
import type { CopyContext } from './copy';
import type { ChoiceStepId, Option, OptionId } from './steps';
import type { ChangeEvent, ReactNode, Ref } from 'react';

interface ChoiceStepProps {
	step: ChoiceStepId;
	options: Option[];
	pick: OptionId | null;
	copy: CopyContext;
	disabled: boolean;
	onPick: ( option: OptionId ) => void;
	/** Receives the question, which takes focus when the step changes. */
	legendRef: Ref< HTMLLegendElement >;
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
		( event: ChangeEvent< HTMLInputElement > ) => {
			const option = options.find( candidate => candidate.id === event.target.value );
			if ( option ) {
				onPick( option.id );
			}
		},
		[ options, onPick ]
	);

	return (
		<fieldset className={ styles.fieldset } disabled={ disabled }>
			<Text
				variant="heading-lg"
				render={ <legend ref={ legendRef } tabIndex={ -1 } /> }
				className={ styles.question }
			>
				{ getStepTitle( step, copy ) }
			</Text>
			<Stack direction="column" gap="sm">
				{ options.map( option => {
					const text = getOptionCopy( option.id, copy );
					const isSelected = option.id === pick;
					const inputId = `${ id }-${ option.id }`;
					const labelId = `${ inputId }-label`;
					const hintId = `${ inputId }-hint`;
					return (
						<label
							key={ option.id }
							htmlFor={ inputId }
							className={ clsx( styles.choice, isSelected && styles[ 'choice--selected' ] ) }
						>
							{ /* Native: the `@wordpress/ui` radio adds far more to a bundle every connection page loads. */ }
							<input
								id={ inputId }
								type="radio"
								name={ `${ id }-pick` }
								value={ option.id }
								checked={ isSelected }
								onChange={ handleChange }
								aria-labelledby={ labelId }
								aria-describedby={ hintId }
							/>
							<Stack direction="column" gap="xs" render={ <span /> }>
								<Text variant="heading-md" id={ labelId }>
									{ text.label }
								</Text>
								<Text variant="body-sm" id={ hintId } className={ styles.hint }>
									{ text.hint }
								</Text>
								{ isSelected && text.more && <Text variant="body-sm">{ text.more }</Text> }
							</Stack>
						</label>
					);
				} ) }
			</Stack>
		</fieldset>
	);
}
