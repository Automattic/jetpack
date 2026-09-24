import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Badge, Icon, Link, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import { getBlockThemeMigration } from '../../../utils/block-theme-migration';
import { getActivationStatusLabel } from '../utils';
import { FeatureAction } from './feature-action';
import { FeatureIcon } from './feature-icon';
import styles from './styles.module.scss';
import { getDeprecatedModules } from './use-more-features';
import type { FeatureState } from './feature-state';
import type { FeatureActionOrigin } from './features-tracking-context';
import type { MyJetpackModule } from '../../../types';
import type { ReactNode } from 'react';

/**
 * The module's settings link, unless all it would lead to is the switch the card already has.
 *
 * @param $module - The module.
 * @return The URL, or undefined.
 */
export function getModuleSettingsUrl( $module: MyJetpackModule ): string | undefined {
	// Deprecated modules are offered only to be switched off; the widgets link opens no widgets panel on a block theme.
	if ( getDeprecatedModules().includes( $module.module ) ) {
		return undefined;
	}

	const url = $module.configure_url;
	// Jetpack's fallback: a settings search, which for a module without options finds only its toggle.
	const isSettingsSearch = url?.includes( 'page=jetpack-settings#/settings?term=' );

	return isSettingsSearch && ! Object.keys( $module.options ?? {} ).length ? undefined : url;
}

type FeatureItemProps = {
	state: FeatureState;
	onOpen?: ( slug: string ) => void;
	leading?: ReactNode;
	className?: string;
	showIcon?: boolean;
	origin?: FeatureActionOrigin;
};

/**
 * A single card, in the grid or flattened into a list row.
 *
 * The title carries the click target and stretches over the whole card, so the action
 * has to sit above it to stay its own control. A card with nothing to open — Jetpack's
 * other modules — drops that target, its chevron and its icon, and is otherwise the same.
 *
 * @param {FeatureItemProps} props           - The component props.
 * @param {FeatureState}     props.state     - Live state for the feature.
 * @param {Function}         props.onOpen    - Opens the feature's details, where it has any.
 * @param {ReactNode}        props.leading   - A control before the icon, raised above the click target.
 * @param {string}           props.className - Extra class for the card.
 * @param {boolean}          props.showIcon  - False drops the icon tile.
 * @param {string}           props.origin    - Which list this card sits in.
 * @return The rendered component.
 */
export function FeatureItem( {
	state,
	onOpen,
	leading,
	className,
	showIcon = true,
	origin,
}: FeatureItemProps ) {
	const { feature } = state;
	const isActive = state.status === 'active';
	const chevron = isRTL() ? chevronLeft : chevronRight;
	const onClick = useCallback( () => onOpen?.( feature.slug ), [ feature.slug, onOpen ] );
	const statusId = `feature-status-${ feature.slug }`;
	// Only while the state is first being read. A switch answers its own click, so
	// mid-request the badge has a value to show and should show it.
	const isSettling = Boolean( state.pending );
	// On a block theme these modules offer the Site Editor instead of a switch, so the card
	// says what to do there and drops a status badge that would only confuse next to it.
	const migration =
		state.control.kind === 'module' ? getBlockThemeMigration( state.control.module ) : null;
	// A card with details keeps its manage link in the modal; the stretched title would cover one here.
	// A migration notice says the legacy settings no longer apply, so it gets no link either.
	const settingsUrl =
		! onOpen && ! migration && isActive && ! state.isSwitching && state.control.kind === 'module'
			? getModuleSettingsUrl( state.control.module )
			: undefined;

	return (
		<div
			className={ clsx( styles[ 'feature-item' ], className, {
				[ styles[ 'feature-item--static' ] ]: ! onOpen,
			} ) }
			data-feature={ feature.slug }
		>
			{ leading && <span className={ styles[ 'feature-leading-slot' ] }>{ leading }</span> }

			{ showIcon && (
				<span className={ styles[ 'feature-item__icon' ] } aria-hidden="true">
					<FeatureIcon feature={ feature } />
				</span>
			) }

			<span className={ styles[ 'feature-item__text' ] }>
				<span className={ styles[ 'feature-item__heading' ] }>
					<Text
						variant="heading-lg"
						className={ styles[ 'feature-item__title' ] }
						render={
							onOpen ? (
								// The accessible name keeps the visible title inside it, so the
								// stretched click target still reads as this feature's card.
								// ds-allow: button -- a title that stretches over the card, not a Button.
								<button
									type="button"
									className={ styles[ 'feature-item__open' ] }
									onClick={ onClick }
									aria-label={ sprintf(
										/* translators: %s is the feature name. */
										__( 'Learn more about %s', 'jetpack-my-jetpack' ),
										feature.name
									) }
								/>
							) : (
								// A span, like the interactive card's button, so both read the same.
								<span className={ styles[ 'feature-item__static-title' ] } />
							)
						}
					>
						{ feature.name }
					</Text>

					{ isSettling && (
						// The box a rendered Badge takes, measured: the heading row is laid out
						// around it, so a shorter placeholder resizes every card on load.
						<LoadingPlaceholder
							width={ 51 }
							height={ 24 }
							className={ styles[ 'skeleton-badge' ] }
						/>
					) }

					{ ! isSettling && ! migration && (
						<Badge id={ statusId } intent={ isActive ? 'stable' : 'none' }>
							{ getActivationStatusLabel( isActive ) }
						</Badge>
					) }

					{ feature.essential ? (
						<Badge intent="informational">{ __( 'Essential', 'jetpack-my-jetpack' ) }</Badge>
					) : null }
				</span>

				<Text variant="body-md" className={ styles[ 'feature-item__description' ] }>
					{ migration?.notice ?? feature.description }
				</Text>
			</span>

			<span className={ styles[ 'feature-action-slot' ] }>
				{ settingsUrl && (
					<Link
						href={ settingsUrl }
						aria-label={ sprintf(
							/* translators: %s is the feature name. */
							__( 'Configure %s', 'jetpack-my-jetpack' ),
							feature.name
						) }
					>
						{ __( 'Configure', 'jetpack-my-jetpack' ) }
					</Link>
				) }
				<FeatureAction
					state={ state }
					origin={ origin }
					describedby={ migration ? undefined : statusId }
				/>
			</span>

			{ /* Left under the stretched title on purpose: it points at the card's own
			     action, so a click on it should open the feature like any other. */ }
			{ onOpen && (
				<span className={ styles[ 'feature-item__chevron' ] } aria-hidden="true">
					<Icon icon={ chevron } size={ 24 } />
				</span>
			) }
		</div>
	);
}
