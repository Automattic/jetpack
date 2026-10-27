import classNames from 'classnames';
import { useContext } from 'react';
import { __unstableCompositeItem as CompositeItem } from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { blockMeta } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';
import { Hooks } from 'wp-js-hooks';
import { AutomationContext, AutomationCompositeContext } from './context';
import { StepMoreMenu } from './step-more-menu';
import { Step as StepData } from './types';
import { Chip } from '../chip';
import { FiltersChip } from '../filters';
import { ColoredIcon } from '../icons';
import { stepSidebarKey, storeName } from '../../store';
import { StepType } from '../../store/types';
import { RenderStepFooterType, StepMoreType } from '../../../types/filters';
import { triggerFilterStrings } from './trigger-filters';

const getUnknownStepType = ( step: StepData ): StepType => {
	const isTrigger = step.type === 'trigger';
	return {
		title: () =>
			isTrigger ? __( 'Unknown trigger', 'mailpoet' ) : __( 'Unknown step', 'mailpoet' ),
		subtitle: () =>
			isTrigger
				? __( 'Trigger type not registered', 'mailpoet' )
				: __( 'Step type not registered', 'mailpoet' ),
		description: () =>
			isTrigger ? __( 'Unknown trigger', 'mailpoet' ) : __( 'Unknown step', 'mailpoet' ),
		keywords: [],
		group: step.type === 'trigger' ? 'triggers' : 'actions',
		key: step.key,
		foreground: '#8c8f94',
		background: '#dcdcde',
		edit: () => null,
		icon: () => blockMeta as JSX.Element,
	};
};

type Props = {
	step: StepData;
	isSelected: boolean;
};

export function Step( { step, isSelected }: Props ): JSX.Element {
	const { stepType, error } = useSelect(
		select => ( {
			stepType: select( storeName ).getStepType( step.key ),
			error: select( storeName ).getStepError( step.id ),
		} ),
		[ step ]
	);
	const { openSidebar, selectStep } = useDispatch( storeName );
	const { context } = useContext( AutomationContext );
	const compositeState = useContext( AutomationCompositeContext );
	const { batch } = useRegistry();

	const compositeItemId = `step-${ step.id }`;
	const stepTypeData = stepType ?? getUnknownStepType( step );

	const Footer = stepType?.footer;
	const footer: RenderStepFooterType = Hooks.applyFilters(
		'mailpoet.automation.step.footer',
		<div className="mailpoet-automation-editor-step-footer">
			{ Footer && <Footer step={ step } /> }
			{ step.type === 'trigger' && <FiltersChip step={ step } strings={ triggerFilterStrings } /> }
			{ error ? (
				<div className="mailpoet-automation-editor-step-error">
					<Chip variant="danger" size="small">
						{ __( 'Not set', 'mailpoet' ) }
					</Chip>
				</div>
			) : null }
		</div>,
		step,
		context,
		isSelected
	);

	return (
		<div className="mailpoet-automation-editor-step-wrapper">
			<StepMoreMenu step={ step } />
			<CompositeItem
				state={ compositeState }
				role="treeitem"
				className={ classNames( {
					'mailpoet-automation-editor-step': true,
					'is-selected-step': isSelected,
					'is-unknown-step': ! stepType,
				} ) }
				id={ compositeItemId }
				key={ step.id }
				focusable
				render={ htmlProps => {
					const propsWithTabIndex = {
						...htmlProps,
						tabIndex: 0,
						onClick:
							context === 'edit'
								? () => {
										if ( typeof htmlProps.onClick === 'function' ) {
											htmlProps.onClick();
										}
										batch( () => {
											void openSidebar( stepSidebarKey );
											void selectStep( step );
										} );
									}
								: htmlProps.onClick,
						onFocus: ( event: React.FocusEvent< HTMLButtonElement > ) => {
							if ( typeof htmlProps.onFocus === 'function' ) {
								htmlProps.onFocus( event );
							}
							if ( context === 'edit' ) {
								void selectStep( step );
							}
						},
					};
					return (
						<button { ...propsWithTabIndex } type="button">
							<div className="mailpoet-automation-editor-step-icon">
								<ColoredIcon
									icon={ stepTypeData.icon }
									foreground={ stepTypeData.foreground }
									background={ stepTypeData.background }
									width="32px"
									height="32px"
								/>
							</div>
							<div>
								<label
									htmlFor={ compositeItemId }
									className="mailpoet-automation-editor-step-title"
								>
									{ step.type !== 'trigger'
										? stepTypeData.title( step, 'automation' )
										: _x( 'Trigger', 'noun', 'mailpoet' ) }
								</label>
								<div className="mailpoet-automation-editor-step-subtitle">
									{ step.type !== 'trigger'
										? stepTypeData.subtitle( step, 'automation' )
										: stepTypeData.title( step, 'automation' ) }
								</div>
							</div>
							{
								Hooks.applyFilters(
									'mailpoet.automation.step.more',
									null,
									step,
									context,
									isSelected
								) as StepMoreType
							}
							{ footer }
						</button>
					);
				} }
			/>
		</div>
	);
}
