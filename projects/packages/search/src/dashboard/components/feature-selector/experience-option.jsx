import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { Badge, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { STORE_ID } from 'store';
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

	const className = clsx( 'jp-search-feature-selector__option', {
		'is-selected': isSelected,
		'is-active': isActive,
		'is-disabled': disabled,
	} );

	const upsellHint = __( 'Upgrade your plan to unlock this option.', 'jetpack-search-pkg' );

	return (
		<label htmlFor={ inputId } className={ className } title={ disabled ? upsellHint : undefined }>
			<Stack
				direction="row"
				gap="md"
				align="center"
				className="jp-search-feature-selector__option-stack"
			>
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
				<Stack direction="column" gap="xs" className="jp-search-feature-selector__option-body">
					<Stack
						direction="row"
						gap="sm"
						align="center"
						className="jp-search-feature-selector__option-title"
					>
						{ getExperienceLabel( experience ) }
						{ isRecommended && (
							<Badge
								intent="informational"
								aria-label={ __( 'Recommended', 'jetpack-search-pkg' ) }
							>
								{ __( 'Recommended', 'jetpack-search-pkg' ) }
							</Badge>
						) }
					</Stack>
					<span className="jp-search-feature-selector__option-description">
						{ getExperienceDescription( experience ) }
					</span>
				</Stack>
				{ isActive && (
					<Badge
						intent="stable"
						className="jp-search-feature-selector__option-trailing"
						aria-label={ __( 'Active', 'jetpack-search-pkg' ) }
					>
						{ __( 'Active', 'jetpack-search-pkg' ) }
					</Badge>
				) }
			</Stack>
		</label>
	);
}
