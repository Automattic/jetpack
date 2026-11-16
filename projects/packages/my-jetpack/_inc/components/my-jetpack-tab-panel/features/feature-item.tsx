import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Badge, Icon, Link, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { getBlockThemeMigration } from '../../../utils/block-theme-migration';
import { getProtectPageUrl } from '../../../utils/protect-page';
import { isSettingsConsolidationEnabled } from '../../../utils/settings-consolidation';
import { getLeavingLinkLabel } from '../../../utils/settings-link-label';
import { FeatureAction } from './feature-action';
import { FeatureIcon } from './feature-icon';
import { FeatureInstallNotice } from './feature-install-notice';
import {
	getForcedReason,
	getModuleUnavailableNote,
	needsAccountWithoutConnect,
	offersConnect,
} from './feature-state';
import { isAccountConnectEnabled } from './mappings';
import {
	getFeatureStatusLabel,
	getFeatureUnavailableReason,
	getModuleStatus,
} from './module-availability';
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
	if ( $module.available === false || getDeprecatedModules().includes( $module.module ) ) {
		return undefined;
	}

	// The Protect page link already stands in for the switch; a forced module gets neither, so it keeps this one.
	if ( getProtectPageUrl( $module.module ) && getModuleStatus( $module ).isAvailable ) {
		return undefined;
	}

	const url = $module.configure_url;
	// Jetpack's fallback: a settings search, which for a module without options finds only its toggle.
	const isSettingsSearch = url?.includes( SETTINGS_SEARCH );

	return isSettingsSearch && ! Object.keys( $module.options ?? {} ).length ? undefined : url;
}

const SETTINGS_SEARCH = 'page=jetpack-settings#/settings?term=';

/**
 * Whether a module's settings open in the panel: its URL is Jetpack's settings-search default or the panel's own.
 *
 * Any other URL, such as the SEO page an opted-in site is sent to, is the module's real home and stays a link.
 *
 * @param url - The module's `configure_url`.
 * @return True when the panel replaces the link.
 */
export function opensInSettingsPanel( url: string ): boolean {
	return (
		url.includes( SETTINGS_SEARCH ) ||
		( url.includes( 'page=my-jetpack' ) && /configure(=|%3D)/.test( url ) )
	);
}

/**
 * Configure for a module, opening the settings panel over the page instead of leaving it.
 *
 * @param props      - Component props.
 * @param props.slug - The module or settings entry slug.
 * @param props.name - The feature name.
 * @return The link.
 */
function PanelConfigureLink( { slug, name }: { slug: string; name: string } ) {
	const [ searchParams ] = useSearchParams();
	const next = new URLSearchParams( searchParams );
	next.set( 'configure', slug );

	return (
		<Link
			render={ <RouterLink to={ { search: `?${ next }` } } replace /> }
			aria-label={ sprintf(
				/* translators: %s is the feature name. */
				__( 'Configure %s', 'jetpack-my-jetpack' ),
				name
			) }
		>
			{ __( 'Configure', 'jetpack-my-jetpack' ) }
		</Link>
	);
}

/**
 * A module's settings link: Configure for the panel, or, with the panel on, the page it leaves for.
 *
 * @param props      - Component props.
 * @param props.url  - The module's settings URL.
 * @param props.slug - The module slug.
 * @param props.name - The feature name.
 * @return The link.
 */
function SettingsLink( { url, slug, name }: { url: string; slug: string; name: string } ) {
	const hasPanel = isSettingsConsolidationEnabled();
	if ( hasPanel && opensInSettingsPanel( url ) ) {
		return <PanelConfigureLink slug={ slug } name={ name } />;
	}

	// Without the panel every link leaves Features, so naming the page would tell people nothing.
	const leaving = hasPanel ? getLeavingLinkLabel( url, name ) : null;

	return (
		<Link
			href={ url }
			aria-label={
				leaving?.label ??
				sprintf(
					/* translators: %s is the feature name. */
					__( 'Configure %s', 'jetpack-my-jetpack' ),
					name
				)
			}
		>
			{ leaving?.text ?? __( 'Configure', 'jetpack-my-jetpack' ) }
		</Link>
	);
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
	const unavailable = getFeatureUnavailableReason( state );
	// Connect or Install already says an account is needed.
	const reason =
		( ( ! state.accountNeeded || needsAccountWithoutConnect( state ) ) && unavailable ) ||
		getModuleUnavailableNote( state );
	// With no Active or Inactive badge, this says why there is no switch, a host's choice or what
	// the site can't run, unless the line above already does.
	const forcedReason = isAccountConnectEnabled() ? getForcedReason( state ) : null;
	const forcedNote = forcedReason !== reason ? forcedReason : null;
	const statusId = `feature-status-${ feature.slug }`;
	// Only while the state is first being read. A switch answers its own click, so
	// mid-request the badge has a value to show and should show it.
	const isSettling = Boolean( state.pending );
	// On a block theme these modules link to Settings › Sharing instead of a switch, so the card
	// says what to do there and drops a status badge that would only confuse next to it.
	const migration =
		state.control.kind === 'module' ? getBlockThemeMigration( state.control.module ) : null;
	// Manage in Protect stands in for the switch but cannot say whether the module is on.
	const linksToProtect =
		state.control.kind === 'module' &&
		! getForcedReason( state ) &&
		Boolean( getProtectPageUrl( state.control.module.module ) );
	const statusLabel = migration ? null : getFeatureStatusLabel( state, linksToProtect );
	// A card with details keeps its manage link in the modal; the stretched title would cover one here.
	// A migration notice says the legacy settings no longer apply, so it gets no link either.
	const settingsUrl =
		! onOpen &&
		! migration &&
		isActive &&
		! state.accountNeeded &&
		! state.isSwitching &&
		state.control.kind === 'module'
			? getModuleSettingsUrl( state.control.module )
			: undefined;

	return (
		<div
			className={ clsx( styles[ 'feature-item' ], className, {
				[ styles[ 'feature-item--static' ] ]: ! onOpen,
				[ styles[ 'feature-item--connect' ] ]: ! state.pending && offersConnect( state ),
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

					{ isSettling && ! isAccountConnectEnabled() && (
						// The box a rendered Badge takes, measured: the heading row is laid out
						// around it, so a shorter placeholder resizes every card on load. With the
						// flag on, most cards settle with no badge, so none is held for them.
						<LoadingPlaceholder
							width={ 51 }
							height={ 24 }
							className={ styles[ 'skeleton-badge' ] }
						/>
					) }

					{ ! isSettling && statusLabel && (
						<Badge
							id={ statusId }
							intent={
								( state.needsSetup && 'medium' ) ||
								( isActive && ! unavailable ? 'stable' : 'none' )
							}
						>
							{ statusLabel }
						</Badge>
					) }

					{ feature.essential ? (
						<Badge intent="informational">{ __( 'Essential', 'jetpack-my-jetpack' ) }</Badge>
					) : null }
				</span>

				<Text variant="body-md" className={ styles[ 'feature-item__description' ] }>
					{ migration?.notice ?? feature.description }
				</Text>

				{ reason && (
					<Text variant="body-sm" className={ styles[ 'install-notice' ] }>
						{ reason }
					</Text>
				) }

				{ forcedNote && (
					<Text variant="body-sm" className={ styles[ 'install-notice' ] }>
						{ forcedNote }
					</Text>
				) }

				<FeatureInstallNotice state={ state } />
			</span>

			<span className={ styles[ 'feature-action-slot' ] }>
				{ state.settingsEntry && ! onOpen && (
					// The switch lives in the panel, so Configure shows even while the setting is off.
					<PanelConfigureLink slug={ feature.slug } name={ feature.name } />
				) }
				{ settingsUrl && (
					<SettingsLink url={ settingsUrl } slug={ feature.slug } name={ feature.name } />
				) }
				<FeatureAction
					state={ state }
					origin={ origin }
					describedby={ statusLabel ? statusId : undefined }
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
