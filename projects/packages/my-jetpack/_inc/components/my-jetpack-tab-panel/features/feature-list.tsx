import { CheckboxControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';
import { useCallback } from 'react';
import { FeatureItem } from './feature-item';
import { getForcedReason } from './feature-state';
import styles from './styles.module.scss';
import { isBulkSwitchable } from './use-bulk-feature-switch';
import type { FeatureState } from './feature-state';
import type { FeatureSelection } from './use-feature-selection';

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

	// A forced feature has no control to point at, so it gets no checkbox; the hidden one holds the column.
	if ( getForcedReason( state ) ) {
		return (
			<span className={ styles[ 'row-checkbox-placeholder' ] } aria-hidden="true">
				<CheckboxControl __nextHasNoMarginBottom checked={ false } disabled onChange={ onChange } />
			</span>
		);
	}

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
	selection: FeatureSelection;
	states: FeatureState[];
	onOpen?: ( slug: string ) => void;
	showIcon?: boolean;
};

/**
 * The features as full-width rows, each with a checkbox for the tab's bulk bar.
 *
 * @param {FeatureListProps} props           - The component props.
 * @param {FeatureSelection} props.selection - The selection shared with the bulk bar.
 * @param {FeatureState[]}   props.states    - The features to show.
 * @param {Function}         props.onOpen    - Opens a feature's details, where the rows have any.
 * @param {boolean}          props.showIcon  - False drops each row's icon tile.
 * @return The rendered component.
 */
export function FeatureList( { selection, states, onOpen, showIcon }: FeatureListProps ) {
	return (
		<div className={ styles[ 'feature-list' ] }>
			<VisuallyHidden id={ UNSWITCHABLE_ID }>{ getUnswitchableReason() }</VisuallyHidden>

			{ states.map( state => (
				<FeatureItem
					key={ state.feature.slug }
					state={ state }
					onOpen={ onOpen }
					showIcon={ showIcon }
					className={ styles[ 'feature-row' ] }
					leading={
						<RowCheckbox
							state={ state }
							isSelected={ selection.isSelected( state.feature.slug ) }
							onSelect={ selection.onSelect }
						/>
					}
				/>
			) ) }
		</div>
	);
}
