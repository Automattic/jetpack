import { __ } from '@wordpress/i18n';
import { ThemeProvider } from '@wordpress/theme';
import { Icon, Stack, Switch, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useId } from 'react';
import { BRAND_COLOR, isWanted } from '../lib';
import styles from '../styles.module.scss';
import { StepHeading } from './step-heading';
import type { SetupModule } from '../use-setup-modules';

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
	disabled?: boolean;
};

/**
 * One row: the module's name, its line, and a switch.
 *
 * @param props          - The component props.
 * @param props.module   - The module this row is for.
 * @param props.checked  - Whether it is switched on.
 * @param props.onChange - Called with the new value.
 * @param props.disabled - Whether the wizard is busy.
 * @return The rendered row.
 */
function FeatureRow( {
	module,
	checked,
	onChange,
	disabled,
}: {
	module: SetupModule;
	checked: boolean;
	onChange: ( slug: string, want: boolean ) => void;
	disabled: boolean;
} ) {
	const toggleId = useId();
	const nameId = useId();
	const descriptionId = useId();

	const handleChange = useCallback(
		( want: boolean ) => onChange( module.slug, want ),
		[ module.slug, onChange ]
	);

	/*
	 * A locked switch says why it cannot move, in Jetpack settings' own words: the
	 * override is a filter, which a plugin can set as well as a host.
	 */
	const note = module.locked ? __( 'Set by a site administrator', 'jetpack-my-jetpack' ) : null;

	return (
		<div className={ styles[ 'feature-row' ] }>
			<span className={ styles[ 'feature-row__glyph' ] } aria-hidden="true">
				<Icon icon={ module.icon } />
			</span>

			{ /*
			 * A label rather than the whole row, so the switch has a target far bigger
			 * than its own 32 by 16 without the row swallowing anything else put in it.
			 *
			 * Hidden from the tree, not from the eye: the switch is named and described
			 * from the two spans inside it, and aria-labelledby reaches hidden content.
			 * Left visible to it as well, every module was announced twice.
			 */ }
			<label aria-hidden="true" htmlFor={ toggleId } className={ styles[ 'feature-row__copy' ] }>
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
					{ note && (
						<>
							{ /* A real space: the dot before it is drawn in CSS, which a screen
							     reader does not read, so the words would run together. */ }{ ' ' }
							<span className={ styles[ 'feature-row__note' ] }>{ note }</span>
						</>
					) }
				</Text>
			</label>

			{ /* Named by the name alone, or the label folds the description into its name. */ }
			<Switch
				id={ toggleId }
				className={ styles[ 'feature-row__switch' ] }
				checked={ checked }
				// Forced by an override: a request to move it would fail, as it does in Jetpack settings.
				disabled={ module.locked || disabled }
				onCheckedChange={ handleChange }
				aria-labelledby={ nameId }
				// The note is its own element, so it is named here or it is unsaid.
				aria-describedby={ descriptionId }
			/>
		</div>
	);
}

/**
 * The feature step: what Jetpack runs, and the chance to switch more on or off.
 *
 * Every row starts at what the site already runs, so nothing changes unless the
 * user moves a switch.
 *
 * @param props             - The component props.
 * @param props.titleId     - The id the panel region is labelled by.
 * @param props.title       - The step heading.
 * @param props.description - The line under the heading.
 * @param props.modules     - The modules on offer, in order.
 * @param props.isLoading   - Whether the site's answer is still on its way.
 * @param props.wanted      - What the user has asked for, by slug.
 * @param props.onChange    - Called with a slug and its new value.
 * @param props.disabled    - Whether every switch is held while the wizard is busy.
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
	disabled = false,
}: FeaturesStepProps ) {
	return (
		<Stack direction="column" gap="2xl" className={ styles[ 'step-body' ] }>
			<StepHeading titleId={ titleId } title={ title } description={ description } />

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
						"Jetpack's features couldn't be loaded. You can turn them on any time from Jetpack settings.",
						'jetpack-my-jetpack'
					) }
				</Text>
			) }

			<ThemeProvider color={ BRAND_COLOR }>
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
								checked={ isWanted( wanted, module ) }
								onChange={ onChange }
								disabled={ disabled }
							/>
						</div>
					) ) }
				</div>
			</ThemeProvider>
		</Stack>
	);
}
