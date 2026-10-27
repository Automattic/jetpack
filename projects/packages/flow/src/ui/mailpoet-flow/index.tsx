import { useMemo, useRef } from 'react';
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	SlotFillProvider,
	Popover,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { AutomationCompositeContext, AutomationContext } from './context';
import { EmptyAutomation } from './empty-automation';
import { InserterPopover } from '../inserter-popover';
import { storeName } from '../../store';
import { Statistics } from './statistics';
import { Flow } from './flow';
import { useAutomationDragToScroll } from './use-automation-drag-to-scroll';
import { useAutomationScroll } from './use-automation-scroll';
import { useAutomationScrollCenter } from './use-automation-scroll-center';

type AutomationProps = {
	context: 'edit' | 'view';
	scroll?: boolean;
	drag?: boolean;
	showStatistics?: boolean;
};

export function Automation( {
	context,
	scroll = true,
	drag = true,
	showStatistics = true,
}: AutomationProps ): JSX.Element {
	const automationData = useSelect( select => select( storeName ).getAutomationData(), [] );

	const automationContext = useMemo( () => ( { context } ), [ context ] );

	const compositeState = useCompositeState( {
		orientation: 'vertical',
		wrap: 'horizontal',
		shift: true,
	} );

	// handle automation scrolling, dragging, and horizontal scroll centering
	const automationRef = useRef< HTMLDivElement | null >( null );
	useAutomationScroll( scroll ? automationRef : undefined );
	useAutomationScrollCenter( automationRef );
	useAutomationDragToScroll( drag ? automationRef : undefined );

	if ( ! automationData ) {
		return <EmptyAutomation />;
	}

	return (
		<AutomationContext.Provider value={ automationContext }>
			<AutomationCompositeContext.Provider value={ compositeState }>
				<SlotFillProvider>
					<div ref={ automationRef } className="mailpoet-automation-editor-automation">
						<Composite
							state={ compositeState }
							role="tree"
							aria-label={ __( 'Automation', 'mailpoet' ) }
							aria-orientation="vertical"
						>
							{ showStatistics && <Statistics /> }
							<div className="mailpoet-automation-editor-automation-wrapper">
								<div className="mailpoet-automation-editor-automation-flow">
									<Flow stepData={ automationData.steps.root } row={ 0 } />
								</div>
								{ /* Spacer element used to balance the grid layout columns; */ }
								{ /* purely presentational and ignored by assistive technologies. */ }
								<div aria-hidden="true" />
								{ /* Render popovers within the automation, so they work in modals and other contexts. */ }
								<Popover.Slot />
							</div>
							<InserterPopover />
						</Composite>
					</div>
				</SlotFillProvider>
			</AutomationCompositeContext.Provider>
		</AutomationContext.Provider>
	);
}
