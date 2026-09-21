import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Badge, Icon, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import { getModuleStatus } from '../../modules-list/utils';
import { getActivationStatusLabel } from '../utils';
import { FeatureAction } from './feature-action';
import { FeatureIcon } from './feature-icon';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';
import type { ReactNode } from 'react';

type FeatureItemProps = {
	state: FeatureState;
	onOpen: ( slug: string ) => void;
	leading?: ReactNode;
	className?: string;
};

/**
 * A single card in the features grid.
 *
 * The title carries the click target and stretches over the whole card, so the action
 * has to sit above it to stay its own control.
 *
 * @param {FeatureItemProps} props           - The component props.
 * @param {FeatureState}     props.state     - Live state for the feature.
 * @param {Function}         props.onOpen    - Opens the feature's details.
 * @param {ReactNode}        props.leading   - A control before the icon, raised above the click target.
 * @param {string}           props.className - Extra class for the card.
 * @return The rendered component.
 */
export function FeatureItem( { state, onOpen, leading, className }: FeatureItemProps ) {
	const { feature } = state;
	const isActive = state.status === 'active';
	const chevron = isRTL() ? chevronLeft : chevronRight;
	const onClick = useCallback( () => onOpen( feature.slug ), [ feature.slug, onOpen ] );
	const statusId = `feature-status-${ feature.slug }`;
	// Only while the state is first being read. A switch answers its own click, so
	// mid-request the badge has a value to show and should show it.
	const isSettling = Boolean( state.pending );
	const forcedNote =
		state.control.kind === 'module' && state.control.module.override
			? getModuleStatus( state.control.module ).reason
			: null;

	return (
		<div className={ clsx( styles[ 'feature-item' ], className ) } data-feature={ feature.slug }>
			{ leading && <span className={ styles[ 'feature-leading-slot' ] }>{ leading }</span> }

			<span className={ styles[ 'feature-item__icon' ] } aria-hidden="true">
				<FeatureIcon feature={ feature } />
			</span>

			<span className={ styles[ 'feature-item__text' ] }>
				<span className={ styles[ 'feature-item__heading' ] }>
					<Text
						variant="heading-lg"
						className={ styles[ 'feature-item__title' ] }
						render={
							// The accessible name keeps the visible title inside it, so the
							// stretched click target still reads as this feature's card.
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
						}
					>
						{ feature.name }
					</Text>

					{ isSettling ? (
						// The box a rendered Badge takes, measured: the heading row is laid out
						// around it, so a shorter placeholder resizes every card on load.
						<LoadingPlaceholder
							width={ 51 }
							height={ 24 }
							className={ styles[ 'skeleton-badge' ] }
						/>
					) : (
						<Badge id={ statusId } intent={ isActive ? 'stable' : 'none' }>
							{ getActivationStatusLabel( isActive ) }
						</Badge>
					) }

					{ feature.essential ? (
						<Badge intent="informational">{ __( 'Essential', 'jetpack-my-jetpack' ) }</Badge>
					) : null }
				</span>

				<Text variant="body-md" className={ styles[ 'feature-item__description' ] }>
					{ feature.description }
				</Text>

				{ forcedNote ? (
					<Badge intent="medium" className={ styles[ 'feature-item__note' ] }>
						{ forcedNote }
					</Badge>
				) : null }
			</span>

			<span className={ styles[ 'feature-action-slot' ] }>
				<FeatureAction state={ state } describedby={ statusId } />
			</span>

			{ /* Left under the stretched title on purpose: it points at the card's own
			     action, so a click on it should open the feature like any other. */ }
			<span className={ styles[ 'feature-item__chevron' ] } aria-hidden="true">
				<Icon icon={ chevron } size={ 24 } />
			</span>
		</div>
	);
}
