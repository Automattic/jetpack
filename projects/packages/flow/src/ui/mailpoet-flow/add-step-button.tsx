import { useContext } from 'react';
import type React from 'react';
import { __unstableCompositeItem as CompositeItem } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { Icon, plus } from '@wordpress/icons';
import { AutomationCompositeContext } from './context';
import { storeName } from '../../store';

type Props = {
	onClick?: ( element: HTMLButtonElement ) => void;
	previousStepId: string;
	index: number;
};

export function AddStepButton( { onClick, previousStepId, index }: Props ): JSX.Element {
	const compositeState = useContext( AutomationCompositeContext );
	const { selectStep } = useDispatch( storeName );
	return (
		<CompositeItem
			state={ compositeState }
			role="treeitem"
			className="mailpoet-automation-editor-add-step-button"
			focusable
			data-previous-step-id={ previousStepId }
			data-index={ index }
			render={ htmlProps => {
				const propsWithTabIndex = {
					...htmlProps,
					tabIndex: 0,
					onClick: ( event: React.MouseEvent< HTMLButtonElement > ) => {
						event.stopPropagation();
						if ( onClick ) {
							onClick( event.currentTarget );
						}
					},
					onFocus: ( event: React.FocusEvent< HTMLButtonElement > ) => {
						if ( typeof htmlProps.onFocus === 'function' ) {
							htmlProps.onFocus( event );
						}
						void selectStep( undefined );
					},
				};
				return (
					<button { ...propsWithTabIndex } type="button">
						<Icon icon={ plus } size={ 16 } />
					</button>
				);
			} }
		/>
	);
}
