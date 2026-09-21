import { CheckboxControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Text, VisuallyHidden } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import { FeatureItem } from './feature-item';
import styles from './styles.module.scss';
import { isBulkSwitchable, useBulkFeatureSwitch } from './use-bulk-feature-switch';
import type { FeatureState } from './feature-state';

// Explains every disabled row checkbox, so the reason is written once.
const UNSWITCHABLE_ID = 'feature-list-unswitchable';

/**
 * Why a row cannot be picked for a bulk action.
 *
 * @return The translated reason.
 */
function getUnswitchableReason(): string {
	return __( 'Change this feature from its own control.', 'jetpack-my-jetpack' );
}

type RowCheckboxProps = {
	state: FeatureState;
	isSelected: boolean;
	onSelect: ( slug: string, selected: boolean ) => void;
};

/**
 * The checkbox that picks one feature for a bulk action.
 *
 * @param {RowCheckboxProps} props            - The component props.
 * @param {FeatureState}     props.state      - Live state for the feature.
 * @param {boolean}          props.isSelected - Whether the feature is picked.
 * @param {Function}         props.onSelect   - Picks or unpicks the feature.
 * @return The rendered component.
 */
function RowCheckbox( { state, isSelected, onSelect }: RowCheckboxProps ) {
	const { slug, name } = state.feature;
	const canSelect = isBulkSwitchable( state );
	const onChange = useCallback(
		( checked: boolean ) => onSelect( slug, checked ),
		[ slug, onSelect ]
	);

	return (
		// The title is on the wrapper: a disabled input gets no hover events of its own.
		<span title={ canSelect ? undefined : getUnswitchableReason() }>
			<CheckboxControl
				__nextHasNoMarginBottom
				checked={ canSelect && isSelected }
				disabled={ ! canSelect }
				onChange={ onChange }
				aria-label={ sprintf(
					/* translators: %s is the feature name. */
					__( 'Select %s', 'jetpack-my-jetpack' ),
					name
				) }
				aria-describedby={ canSelect ? undefined : UNSWITCHABLE_ID }
			/>
		</span>
	);
}

type FeatureListProps = {
	states: FeatureState[];
	onOpen: ( slug: string ) => void;
};

/**
 * The features as full-width rows, each with a checkbox for switching several at once.
 *
 * @param {FeatureListProps} props        - The component props.
 * @param {FeatureState[]}   props.states - The features to show.
 * @param {Function}         props.onOpen - Opens a feature's details.
 * @return The rendered component.
 */
export function FeatureList( { states, onOpen }: FeatureListProps ) {
	const [ selected, setSelected ] = useState< Set< string > >( () => new Set() );
	const { run, isRunning } = useBulkFeatureSwitch();
	// Rows in flight also count, so a run started before the view last changed still holds the bar.
	const isBusy = isRunning || states.some( state => state.isSwitching );

	const selectable = useMemo( () => states.filter( isBulkSwitchable ), [ states ] );
	// Only what is on screen and still switchable: a filter or search hides the rest.
	const picked = useMemo(
		() => selectable.filter( state => selected.has( state.feature.slug ) ),
		[ selectable, selected ]
	);
	const allPicked = selectable.length > 0 && picked.length === selectable.length;

	const onSelect = useCallback( ( slug: string, isPicked: boolean ) => {
		setSelected( previous => {
			const next = new Set( previous );

			if ( isPicked ) {
				next.add( slug );
			} else {
				next.delete( slug );
			}

			return next;
		} );
	}, [] );

	const onSelectAll = useCallback(
		( checked: boolean ) =>
			setSelected( checked ? new Set( selectable.map( state => state.feature.slug ) ) : new Set() ),
		[ selectable ]
	);

	const switchPicked = useCallback(
		async ( active: boolean ) => {
			await run( picked, active );
			setSelected( new Set() );
		},
		[ picked, run ]
	);
	const onActivate = useCallback( () => switchPicked( true ), [ switchPicked ] );
	const onDeactivate = useCallback( () => switchPicked( false ), [ switchPicked ] );

	const canActivate = picked.some( state => state.status !== 'active' );
	const canDeactivate = picked.some( state => state.status === 'active' );

	return (
		<div className={ styles[ 'feature-list' ] }>
			<div className={ styles[ 'bulk-bar' ] }>
				<CheckboxControl
					__nextHasNoMarginBottom
					checked={ allPicked }
					indeterminate={ picked.length > 0 && ! allPicked }
					disabled={ ! selectable.length || isBusy }
					onChange={ onSelectAll }
					aria-label={ __( 'Select all features', 'jetpack-my-jetpack' ) }
				/>
				<Text variant="body-md" className={ styles[ 'bulk-bar__count' ] } role="status">
					{ picked.length
						? sprintf(
								/* translators: %d is how many features are selected. */
								_n( '%d selected', '%d selected', picked.length, 'jetpack-my-jetpack' ),
								picked.length
							)
						: __( 'Select features to switch several at once', 'jetpack-my-jetpack' ) }
				</Text>
				<Button
					variant="outline"
					size="compact"
					disabled={ isBusy || ! canActivate }
					onClick={ onActivate }
				>
					{ __( 'Activate', 'jetpack-my-jetpack' ) }
				</Button>
				<Button
					variant="outline"
					size="compact"
					disabled={ isBusy || ! canDeactivate }
					onClick={ onDeactivate }
				>
					{ __( 'Deactivate', 'jetpack-my-jetpack' ) }
				</Button>
			</div>

			<VisuallyHidden id={ UNSWITCHABLE_ID }>{ getUnswitchableReason() }</VisuallyHidden>

			{ states.map( state => (
				<FeatureItem
					key={ state.feature.slug }
					state={ state }
					onOpen={ onOpen }
					className={ styles[ 'feature-row' ] }
					leading={
						<RowCheckbox
							state={ state }
							isSelected={ selected.has( state.feature.slug ) }
							onSelect={ onSelect }
						/>
					}
				/>
			) ) }
		</div>
	);
}
