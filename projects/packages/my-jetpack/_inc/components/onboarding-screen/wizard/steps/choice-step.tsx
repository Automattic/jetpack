import { isRTL, __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Icon, InputControl, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useEffect, useRef } from 'react';
import styles from '../styles.module.scss';
import type { WizardStepOption } from '../lib';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';

type ChoiceStepProps = {
	// Owned by the wizard so the panel region can be labelled by the heading.
	titleId: string;
	title: string;
	description: string;
	// An empty list renders the heading alone, with nothing to choose.
	options: WizardStepOption[];
	value?: string;
	onChange: ( value: string ) => void;
	// The answer typed into the field a `freeText` option opens.
	freeText?: string;
	onFreeTextChange?: ( value: string ) => void;
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
 * The field an option opens, and the only thing that mounts with it.
 *
 * Focus is moved here on mount rather than by `autoFocus`, and only when the row
 * was activated deliberately. Arrowing onto the row merely previews it, and
 * taking focus then is a trap: the arrow keys belong to the radio group, so once
 * they land in a text field there is no way back up the list.
 *
 * The ref sits on the wrapper and the input is found inside it, because the
 * control owns its own markup and forwarding is not part of its contract.
 *
 * @param props           - The component props.
 * @param props.value     - What has been typed so far.
 * @param props.onChange  - Called with what the user types.
 * @param props.takeFocus - Whether to move focus into the field on mount.
 * @return The rendered field.
 */
function FreeTextField( {
	value,
	onChange,
	takeFocus,
}: {
	value: string;
	onChange: ( value: string ) => void;
	takeFocus: boolean;
} ) {
	const wrapperRef = useRef< HTMLDivElement >( null );

	useEffect( () => {
		if ( takeFocus ) {
			wrapperRef.current?.querySelector( 'input' )?.focus();
		}
		// Only ever on mount: moving focus later would fight whoever has it.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const handleChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => onChange( event.target.value ),
		[ onChange ]
	);

	return (
		<div ref={ wrapperRef } className={ styles[ 'step-freetext' ] }>
			<InputControl
				label={ __( 'Tell us what this site is for', 'jetpack-my-jetpack' ) }
				hideLabelFromVision
				placeholder={ __( "Tell us what you're building", 'jetpack-my-jetpack' ) }
				value={ value }
				onChange={ handleChange }
			/>
		</div>
	);
}

/**
 * A question: a heading, a standfirst, and one hand-rolled radio group.
 *
 * `@wordpress/ui` has no RadioGroup, so the group carries its own ARIA and roving
 * tab stop. An option marked `freeText` opens a field under the list for an answer
 * the list does not cover.
 *
 * @param props                  - The component props.
 * @param props.titleId          - The id the panel region is labelled by.
 * @param props.title            - The step heading.
 * @param props.description      - The line under the heading.
 * @param props.options          - The choices offered, possibly none.
 * @param props.value            - The chosen option's value, if any.
 * @param props.onChange         - Called with the value the user picks.
 * @param props.freeText         - What has been typed into the free-text field.
 * @param props.onFreeTextChange - Called with what the user types.
 * @return The rendered step.
 */
export function ChoiceStep( {
	titleId,
	title,
	description,
	options,
	value,
	onChange,
	freeText = '',
	onFreeTextChange,
}: ChoiceStepProps ) {
	const groupRef = useRef< HTMLDivElement >( null );
	/*
	 * Whether the last answer was committed rather than merely arrowed onto. The
	 * field only takes focus for a deliberate choice.
	 */
	const chosenDeliberately = useRef( false );

	const handleClick = useCallback(
		( event: MouseEvent< HTMLButtonElement > ) => {
			chosenDeliberately.current = true;
			onChange( event.currentTarget.value );
		},
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

			chosenDeliberately.current = false;
			next.focus();
			onChange( next.value );
		},
		[ onChange ]
	);

	// The first option holds the group's tab stop until something is chosen.
	const tabStop = value ?? options[ 0 ]?.value;
	const chosen = options.find( option => option.value === value );

	return (
		<Stack direction="column" gap="xl">
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

			{ options.length > 0 && (
				<div>
					<div
						ref={ groupRef }
						role="radiogroup"
						aria-labelledby={ titleId }
						className={ clsx( styles[ 'step-options' ], styles.wave, styles[ 'wave-3' ] ) }
					>
						{ options.map( ( option, index ) => (
							<button
								key={ option.value }
								type="button"
								role="radio"
								value={ option.value }
								aria-checked={ value === option.value }
								tabIndex={ option.value === tabStop ? 0 : -1 }
								className={ styles[ 'step-option' ] }
								// The cascade's own delay, counted in rows rather than written
								// per row, so a step with a different number of them still works.
								style={ { '--row-index': index } as React.CSSProperties }
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

					{ /*
					 * Mounted only while its option is chosen, so the field is never a tab
					 * stop the user cannot see.
					 */ }
					{ chosen?.freeText && onFreeTextChange && (
						<FreeTextField
							value={ freeText }
							onChange={ onFreeTextChange }
							takeFocus={ chosenDeliberately.current }
						/>
					) }
				</div>
			) }
		</Stack>
	);
}
