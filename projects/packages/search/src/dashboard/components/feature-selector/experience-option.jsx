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
	const { selected, active } = useSelect(
		select => ( {
			selected: select( STORE_ID ).getSelectedExperience(),
			active: select( STORE_ID ).getActiveExperience(),
		} ),
		[]
	);
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
		<Stack
			gap="lg"
			align="center"
			className={ className }
			// eslint-disable-next-line jsx-a11y/label-has-associated-control -- Stack passes htmlFor onto the rendered <label> at runtime; the static analyzer can't see through render-prop indirection.
			render={ <label htmlFor={ inputId } title={ disabled ? upsellHint : undefined } /> }
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
			<Stack direction="column" gap="sm" className="jp-search-feature-selector__option-content">
				<Stack
					gap="sm"
					align="center"
					wrap="wrap"
					className="jp-search-feature-selector__option-headline"
				>
					<Icon
						className="jp-search-feature-selector__option-icon"
						icon={ getExperienceIcon( experience ) }
					/>
					<span className="jp-search-feature-selector__option-title">
						{ getExperienceLabel( experience ) }
					</span>
					{ isRecommended && (
						<Badge intent="informational" aria-label={ __( 'Recommended', 'jetpack-search-pkg' ) }>
							{ __( 'Recommended', 'jetpack-search-pkg' ) }
						</Badge>
					) }
				</Stack>
				<span className="jp-search-feature-selector__option-description">
					{ getExperienceDescription( experience ) }
				</span>
			</Stack>
			{ isActive && (
				<Badge intent="stable" aria-label={ __( 'Active', 'jetpack-search-pkg' ) }>
					{ __( 'Active', 'jetpack-search-pkg' ) }
				</Badge>
			) }
		</Stack>
	);
}
