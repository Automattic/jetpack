import { isRTL } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Icon, Stack, Text } from '@wordpress/ui';
import { useCallback, useRef } from 'react';
import styles from '../styles.module.scss';
import type { WizardStepOption } from '../lib';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

type PlaceholderStepProps = {
	// Owned by the wizard so the panel region can be labelled by the heading.
	titleId: string;
	title: string;
	description: string;
	// The dots and counter, which sit under the standfirst and above the options.
	progress?: ReactNode;
	// An empty list renders the heading alone, with nothing to choose.
	options: WizardStepOption[];
	value?: string;
	onChange: ( value: string ) => void;
};

// Arrow keys move the selection inside a radiogroup, as they do for native radios.
const VERTICAL_STEP_BY_KEY: Record< string, number > = {
	ArrowDown: 1,
	ArrowUp: -1,
};

// Horizontal arrows follow the writing direction; the vertical pair never mirrors.
const HORIZONTAL_STEP_BY_KEY: Record< string, number > = {
	ArrowRight: 1,
	ArrowLeft: -1,
};

/**
 * A stand-in step: a heading, a standfirst, and one hand-rolled radio group.
 *
 * `@wordpress/ui` has no RadioGroup, so the group carries its own ARIA and roving
 * tab stop. Stage 3 replaces the content, not the shape.
 *
 * @param props             - The component props.
 * @param props.titleId     - The id the panel region is labelled by.
 * @param props.title       - The step heading.
 * @param props.description - The line under the heading.
 * @param props.progress    - The progress dots and counter.
 * @param props.options     - The choices offered, possibly none.
 * @param props.value       - The chosen option's value, if any.
 * @param props.onChange    - Called with the value the user picks.
 * @return The rendered step.
 */
export function PlaceholderStep( {
	titleId,
	title,
	description,
	progress,
	options,
	value,
	onChange,
}: PlaceholderStepProps ) {
	const groupRef = useRef< HTMLDivElement >( null );

	const handleClick = useCallback(
		( event: MouseEvent< HTMLButtonElement > ) => onChange( event.currentTarget.value ),
		[ onChange ]
	);

	const handleKeyDown = useCallback(
		( event: KeyboardEvent< HTMLButtonElement > ) => {
			const offset =
				VERTICAL_STEP_BY_KEY[ event.key ] ??
				( HORIZONTAL_STEP_BY_KEY[ event.key ] ?? 0 ) * ( isRTL() ? -1 : 1 );
			if ( ! offset ) {
				return;
			}
			event.preventDefault();

			const radios = Array.from(
				groupRef.current?.querySelectorAll< HTMLButtonElement >( '[role="radio"]' ) ?? []
			);
			const next =
				radios[
					( radios.indexOf( event.currentTarget ) + offset + radios.length ) % radios.length
				];

			next.focus();
			onChange( next.value );
		},
		[ onChange ]
	);

	// The first option holds the group's tab stop until something is chosen.
	const tabStop = value ?? options[ 0 ]?.value;

	return (
		<Stack direction="column" gap="xl">
			<Stack direction="column" gap="xs">
				<Text variant="heading-2xl" id={ titleId } render={ <h1 /> }>
					{ title }
				</Text>
				<Text variant="body-lg" render={ <p /> } className={ styles[ 'step-description' ] }>
					{ description }
				</Text>
			</Stack>

			{ progress }

			{ options.length > 0 && (
				<div
					ref={ groupRef }
					role="radiogroup"
					aria-labelledby={ titleId }
					className={ styles[ 'step-options' ] }
				>
					{ options.map( option => (
						<button
							key={ option.value }
							type="button"
							role="radio"
							value={ option.value }
							aria-checked={ value === option.value }
							tabIndex={ option.value === tabStop ? 0 : -1 }
							className={ styles[ 'step-option' ] }
							onClick={ handleClick }
							onKeyDown={ handleKeyDown }
						>
							<span className={ styles[ 'step-option__glyph' ] } aria-hidden="true">
								<Icon icon={ option.icon } />
							</span>
							<Text variant="body-lg" className={ styles[ 'step-option__label' ] }>
								{ option.label }
							</Text>
							<span className={ styles[ 'step-option__tick' ] } aria-hidden="true">
								<Icon icon={ check } />
							</span>
						</button>
					) ) }
				</div>
			) }
		</Stack>
	);
}
