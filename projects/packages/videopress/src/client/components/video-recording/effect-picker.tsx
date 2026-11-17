import { __, sprintf } from '@wordpress/i18n';
import { useId, useRef, useState } from 'react';
import { getRecordingFilter, RECORDING_EFFECTS } from '../../lib/video-recording/effects';
import type { RecordingEffect } from '../../lib/video-recording/effects';
import type { KeyboardEvent } from 'react';

/**
 * Choose a preset that is applied to the camera monitor and captured frames.
 *
 * @param props          - Selected preset, change callback, and availability.
 * @param props.value    - Selected effect.
 * @param props.onChange - Select a different effect.
 * @param props.disabled - Whether controls are unavailable.
 * @return Effect preset controls.
 */
export default function EffectPicker( {
	value,
	onChange,
	disabled,
}: {
	value: RecordingEffect;
	onChange: ( effect: RecordingEffect ) => void;
	disabled: boolean;
} ) {
	const [ open, setOpen ] = useState( false );
	const panelId = useId();
	const toggle = useRef< HTMLButtonElement >( null );
	const closeOnEscape = ( event: KeyboardEvent< HTMLButtonElement > ) => {
		if ( event.key === 'Escape' && open ) {
			event.stopPropagation();
			setOpen( false );
			toggle.current?.focus();
		}
	};

	return (
		<div className="videopress-recording__effect-picker">
			<button
				ref={ toggle }
				type="button"
				className="videopress-recording__overlay-button"
				aria-expanded={ open }
				aria-controls={ panelId }
				disabled={ disabled }
				onClick={ () => setOpen( previous => ! previous ) }
				onKeyDown={ closeOnEscape }
			>
				{ __( 'Filters', 'jetpack-videopress-pkg' ) }
			</button>
			<div
				id={ panelId }
				className={ `videopress-recording__effects${ open ? ' is-open' : '' }` }
				role="group"
				aria-label={ __( 'Video effects', 'jetpack-videopress-pkg' ) }
				aria-hidden={ ! open }
			>
				{ RECORDING_EFFECTS.map( effect => (
					<button
						key={ effect.id }
						type="button"
						className="videopress-recording__effect"
						aria-label={ sprintf(
							/* translators: %s: video effect name. */ __( '%s effect', 'jetpack-videopress-pkg' ),
							effect.label
						) }
						aria-pressed={ value === effect.id }
						disabled={ disabled || ! open }
						onClick={ () => onChange( effect.id ) }
						onKeyDown={ closeOnEscape }
					>
						<span
							className="videopress-recording__effect-swatch"
							style={ { filter: getRecordingFilter( effect.id ) } }
							aria-hidden="true"
						/>
						<span>{ effect.label }</span>
					</button>
				) ) }
			</div>
		</div>
	);
}
