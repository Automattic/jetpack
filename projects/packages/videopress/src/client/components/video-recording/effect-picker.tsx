import { __, sprintf } from '@wordpress/i18n';
import { getRecordingFilter, RECORDING_EFFECTS } from '../../lib/video-recording/effects';
import type { RecordingEffect } from '../../lib/video-recording/effects';

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
	return (
		<div
			className="videopress-recording__effects"
			role="group"
			aria-label={ __( 'Video effects', 'jetpack-videopress-pkg' ) }
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
					disabled={ disabled }
					onClick={ () => onChange( effect.id ) }
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
	);
}
