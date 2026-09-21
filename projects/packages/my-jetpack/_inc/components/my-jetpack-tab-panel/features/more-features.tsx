import { __ } from '@wordpress/i18n';
import { Badge, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { moduleSwitchKey, useRequestedSwitch } from '../../../data/requested-switch-state';
import { getBlockThemeMigration } from '../../../utils/block-theme-migration';
import { ModuleToggle } from '../../module-toggle';
import { getActivationStatusLabel } from '../utils';
import { JetpackButton } from './feature-action';
import { FeatureList } from './feature-list';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';
import type { FeatureSelection } from './use-feature-selection';
import type { MoreFeaturesGroup } from './use-more-features';
import type { MyJetpackModule } from '../../../types';
import type { ReactNode } from 'react';

type MoreFeatureItemProps = {
	module: MyJetpackModule;
	leading?: ReactNode;
	className?: string;
};

/**
 * A module's card: its name, status and switch, with no icon or details of its own.
 *
 * @param {MoreFeatureItemProps} props           - The component props.
 * @param {MyJetpackModule}      props.module    - The module.
 * @param {ReactNode}            props.leading   - A control before the text, such as the list view's checkbox.
 * @param {string}               props.className - Extra class for the card.
 * @return The rendered component.
 */
function MoreFeatureItem( { module: $module, leading, className }: MoreFeatureItemProps ) {
	// The badge follows the switch while its request is out, as the main cards do.
	const requested = useRequestedSwitch( moduleSwitchKey( $module.module ) );
	const isActive = requested ?? $module.activated;
	const statusId = `more-feature-status-${ $module.module }`;
	// On a block theme these modules offer the Site Editor instead of a switch, so the row
	// says what to do there and drops a status badge that would only confuse next to it.
	const migration = getBlockThemeMigration( $module );

	return (
		<div
			className={ clsx( styles[ 'more-feature-item' ], className ) }
			data-module={ $module.module }
		>
			{ leading && <span className={ styles[ 'feature-leading-slot' ] }>{ leading }</span> }
			<span className={ styles[ 'feature-item__text' ] }>
				<span className={ styles[ 'feature-item__heading' ] }>
					<Text
						variant="heading-md"
						render={ <h4 /> }
						className={ styles[ 'feature-item__title' ] }
					>
						{ $module.name }
					</Text>
					{ ! migration && (
						<Badge id={ statusId } intent={ isActive ? 'stable' : 'none' }>
							{ getActivationStatusLabel( isActive ) }
						</Badge>
					) }
				</span>
				<Text variant="body-md" className={ styles[ 'feature-item__description' ] }>
					{ migration?.notice ?? $module.description }
				</Text>
			</span>
			<span className={ styles[ 'more-feature-item__action' ] }>
				<ModuleToggle
					module={ $module }
					reloadAfterToggle={ false }
					describedby={ migration ? undefined : statusId }
				/>
			</span>
		</div>
	);
}

/**
 * A module's row in the list view, with the checkbox the list hands it.
 *
 * @param state   - The module, as a feature row.
 * @param leading - The row's checkbox.
 * @return The rendered row.
 */
function renderModuleRow( state: FeatureState, leading: ReactNode ) {
	return state.control.kind === 'module' ? (
		<MoreFeatureItem
			module={ state.control.module }
			leading={ leading }
			className={ styles[ 'feature-row' ] }
		/>
	) : null;
}

type MoreFeaturesProps = {
	groups: MoreFeaturesGroup[];
	listStates: Record< string, FeatureState[] >;
	selection: FeatureSelection;
	jetpack: MainFeaturePluginStatus;
	isList?: boolean;
};

/**
 * Jetpack's other modules, under headings, below the main features.
 *
 * Shown only where Jetpack is installed; while it is off, the modules cannot be read, so
 * the section offers to activate it instead.
 *
 * @param {MoreFeaturesProps}   props            - The component props.
 * @param {MoreFeaturesGroup[]} props.groups     - The modules to show, grouped.
 * @param {object}              props.listStates - The same modules as feature rows, by group label, for the list view.
 * @param {FeatureSelection}    props.selection  - The selection shared with the bulk bar.
 * @param {string}              props.jetpack    - The Jetpack plugin's status.
 * @param {boolean}             props.isList     - Whether the tab is in its list view.
 * @return The rendered component, or null when there is nothing to show.
 */
export function MoreFeatures( {
	groups,
	listStates,
	selection,
	jetpack,
	isList = false,
}: MoreFeaturesProps ) {
	if ( jetpack !== 'inactive' && ! ( jetpack === 'active' && groups.length ) ) {
		return null;
	}

	let body: ReactNode;

	if ( jetpack === 'inactive' ) {
		body = (
			<div className={ styles[ 'more-features__inactive' ] }>
				<Text variant="body-md">
					{ __(
						'Activate the Jetpack plugin to see and switch its other features.',
						'jetpack-my-jetpack'
					) }
				</Text>
				<JetpackButton installed />
			</div>
		);
	} else {
		// One heading for both views, so a group is titled the same way whichever is on.
		body = groups.map( group => (
			<div key={ group.label } className={ styles[ 'more-features__group' ] }>
				<Text variant="heading-lg" render={ <h3 /> } className={ styles[ 'feature-item__title' ] }>
					{ group.label }
				</Text>
				{ isList ? (
					<FeatureList
						states={ listStates[ group.label ] ?? [] }
						selection={ selection }
						renderRow={ renderModuleRow }
					/>
				) : (
					<div className={ styles[ 'feature-grid' ] }>
						{ group.modules.map( $module => (
							<MoreFeatureItem key={ $module.module } module={ $module } />
						) ) }
					</div>
				) }
			</div>
		) );
	}

	return (
		<section className={ styles[ 'more-features' ] } aria-labelledby="more-features-heading">
			<Text variant="heading-xl" render={ <h2 id="more-features-heading" /> }>
				{ __( 'More Features', 'jetpack-my-jetpack' ) }
			</Text>
			{ body }
		</section>
	);
}
