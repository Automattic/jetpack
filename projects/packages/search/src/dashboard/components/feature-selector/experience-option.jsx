import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { STORE_ID } from 'store';
import Badge from './badge';
import {
	EXPERIENCE,
	getExperienceLabel,
	getExperienceDescription,
	getExperienceIcon,
} from './constants';

/**
 * One row in the feature selector — a styled <label> wrapping a native radio
 * input plus an icon, title, description, and ACTIVE / RECOMMENDED badges.
 *
 * Native radios are intentional: keyboard nav (arrow keys move within a
 * radiogroup) is free, and label association makes the entire row a hit
 * target without extra ARIA wiring.
 *
 * Plan-gating: when the parent passes `disabled={true}` (currently for
 * 'embedded' / 'overlay' on classic-only plans), the native `disabled`
 * attribute on the radio prevents selection and a `title` attribute on the
 * label gives sighted users an upsell hint. A styled Tooltip / upsell nudge
 * is a follow-up.
 *
 * @param {object}  props            - Component props.
 * @param {string}  props.experience - One of the EXPERIENCE values.
 * @param {boolean} props.disabled   - True if the user's plan doesn't support this experience.
 * @return {import('react').Element} - The option row.
 */
export default function ExperienceOption( { experience, disabled = false } ) {
	const selected = useSelect( select => select( STORE_ID ).getSelectedExperience(), [] );
	const active = useSelect( select => select( STORE_ID ).getActiveExperience(), [] );
	const { setPendingExperience } = useDispatch( STORE_ID );

	const isSelected = selected === experience;
	const isActive = active === experience;
	const isRecommended = experience === EXPERIENCE.EMBEDDED;

	const inputId = `jp-search-experience-${ experience }`;

	const className = [
		'jp-search-feature-selector__option',
		isSelected && 'is-selected',
		isActive && 'is-active',
		disabled && 'is-disabled',
	]
		.filter( Boolean )
		.join( ' ' );

	const upsellHint = __( 'Upgrade your plan to unlock this option.', 'jetpack-search-pkg' );

	return (
		<label htmlFor={ inputId } className={ className } title={ disabled ? upsellHint : undefined }>
			<input
				id={ inputId }
				type="radio"
				name="jp-search-experience"
				className="jp-search-feature-selector__option-radio"
				value={ experience }
				checked={ isSelected }
				disabled={ disabled }
				onChange={ disabled ? undefined : () => setPendingExperience( experience ) }
			/>
			<Icon
				className="jp-search-feature-selector__option-icon"
				icon={ getExperienceIcon( experience ) }
			/>
			<span className="jp-search-feature-selector__option-body">
				<span className="jp-search-feature-selector__option-title">
					{ getExperienceLabel( experience ) }
					{ isRecommended && (
						<Badge variant="recommended" ariaLabel={ __( 'Recommended', 'jetpack-search-pkg' ) }>
							{ __( 'Recommended', 'jetpack-search-pkg' ) }
						</Badge>
					) }
				</span>
				<span className="jp-search-feature-selector__option-description">
					{ getExperienceDescription( experience ) }
				</span>
			</span>
			{ isActive && (
				<Badge variant="active" ariaLabel={ __( 'Active', 'jetpack-search-pkg' ) }>
					{ __( 'Active', 'jetpack-search-pkg' ) }
				</Badge>
			) }
		</label>
	);
}
