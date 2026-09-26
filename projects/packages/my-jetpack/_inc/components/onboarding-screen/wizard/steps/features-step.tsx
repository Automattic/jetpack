import { FormToggle } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useId } from 'react';
import { isWanted } from '../lib';
import styles from '../styles.module.scss';
import type { SetupModule } from '../use-setup-modules';
import type { ChangeEvent } from 'react';

type FeaturesStepProps = {
	// Owned by the wizard so the panel region can be labelled by the heading.
	titleId: string;
	title: string;
	description: string;
	modules: SetupModule[];
	// True while the site is still being asked what it runs.
	isLoading?: boolean;
	// Missing entries mean the module keeps whatever the site already does.
	wanted: Record< string, boolean >;
	onChange: ( slug: string, want: boolean ) => void;
};

/**
 * One row: the module's name, its line, and a switch.
 *
 * @param props          - The component props.
 * @param props.module   - The module this row is for.
 * @param props.checked  - Whether it is switched on.
 * @param props.onChange - Called with the new value.
 * @return The rendered row.
 */
function FeatureRow( {
	module,
	checked,
	onChange,
}: {
	module: SetupModule;
	checked: boolean;
	onChange: ( slug: string, want: boolean ) => void;
} ) {
	const nameId = useId();
	const descriptionId = useId();

	const handleChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => onChange( module.slug, event.target.checked ),
		[ module.slug, onChange ]
	);

	return (
		// A label, so the whole row is the switch's target rather than its 32x16
		// input; every child is a span, which is all a label may hold.
		// eslint-disable-next-line jsx-a11y/label-has-associated-control -- FormToggle renders the input this label wraps; the rule cannot see through a component.
		<label className={ styles[ 'feature-row' ] }>
			<span className={ styles[ 'feature-row__glyph' ] } aria-hidden="true">
				<Icon icon={ module.icon } />
			</span>

			{ /*
			 * Hidden from the tree, not from the eye: the switch is named and
			 * described from these two, and aria-labelledby reaches hidden content.
			 * Left visible to it as well, every module was announced twice.
			 */ }
			<span aria-hidden="true" className={ styles[ 'feature-row__copy' ] }>
				<Text
					variant="body-lg"
					id={ nameId }
					className={ styles[ 'feature-row__name' ] }
					render={ <span /> }
				>
					{ module.name }
				</Text>
				<Text
					variant="body-md"
					id={ descriptionId }
					render={ <span /> }
					className={ styles[ 'feature-row__description' ] }
				>
					{ module.description }
					{ /*
					 * Five of the six ship on, so most of this list is not a list of
					 * things about to happen. Saying which are already running is the
					 * difference between asking permission and reporting the state.
					 */ }
					{ module.activated && (
						<>
							{ /* A real space, because the dot between them is drawn in CSS and a
							     screen reader would otherwise run the two together. */ }{ ' ' }
							<span className={ styles[ 'feature-row__already' ] }>
								{ __( 'Already on', 'jetpack-my-jetpack' ) }
							</span>
						</>
					) }
				</Text>
			</span>

			{ /*
			 * FormToggle rather than a WPDS control: @wordpress/ui ships no switch, and
			 * this is what every other module toggle in My Jetpack uses. Named by the
			 * name alone, or the label folds the description into the switch's name.
			 */ }
			<FormToggle
				checked={ checked }
				onChange={ handleChange }
				aria-labelledby={ nameId }
				aria-describedby={ descriptionId }
			/>
		</label>
	);
}

/**
 * The feature step: what Jetpack will switch on, and the chance to say otherwise.
 *
 * Every row starts on. Five of the six ship on already, so for most sites this is
 * showing the user what was going to happen rather than asking them to opt in.
 *
 * @param props             - The component props.
 * @param props.titleId     - The id the panel region is labelled by.
 * @param props.title       - The step heading.
 * @param props.description - The line under the heading.
 * @param props.modules     - The modules on offer, in order.
 * @param props.isLoading   - Whether the site's answer is still on its way.
 * @param props.wanted      - What the user has asked for, by slug.
 * @param props.onChange    - Called with a slug and its new value.
 * @return The rendered step.
 */
export function FeaturesStep( {
	titleId,
	title,
	description,
	modules,
	isLoading = false,
	wanted,
	onChange,
}: FeaturesStepProps ) {
	return (
		<Stack direction="column" gap="2xl">
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

			{ /*
			 * A heading promising a list needs a list under it. Neither of these is a
			 * theoretical state: the modules come from a request, and a site whose
			 * Jetpack has none of the six reports none.
			 */ }
			{ isLoading && (
				<Text variant="body-lg" render={ <p /> } className={ styles[ 'step-description' ] }>
					{ __( 'Checking what this site already runs…', 'jetpack-my-jetpack' ) }
				</Text>
			) }

			{ ! isLoading && modules.length === 0 && (
				<Text variant="body-lg" render={ <p /> } className={ styles[ 'step-description' ] }>
					{ __(
						'There is nothing to switch on here. You can turn features on any time from Jetpack settings.',
						'jetpack-my-jetpack'
					) }
				</Text>
			) }

			<div className={ clsx( styles[ 'feature-rows' ], styles.wave, styles[ 'wave-3' ] ) }>
				{ modules.map( ( module, index ) => (
					<div
						key={ module.slug }
						// The same cascade the answers above use, counted the same way.
						className={ styles[ 'feature-row__wrap' ] }
						style={ { '--row-index': index } as React.CSSProperties }
					>
						<FeatureRow
							module={ module }
							checked={ isWanted( wanted, module.slug ) }
							onChange={ onChange }
						/>
					</div>
				) ) }
			</div>
		</Stack>
	);
}
