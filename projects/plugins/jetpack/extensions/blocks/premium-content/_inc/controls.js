/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { BlockControls } from '@wordpress/block-editor';
import { DropdownMenu, ToolbarGroup, ToolbarItem } from '@wordpress/components';
import { Icon, update } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Plans from './plans';
import NewPlan from './new-plan';

/**
 * @typedef { import('./plans').Plan } Plan
 * @typedef {object} Props
 * @property { number } selectedPlanId
 * @property { (plan: Plan) => void } onSelected
 * @property { (plan: Plan) => string } formatPrice
 * @property { string } className
 * @property { Plan[] } plans
 * @param { Props } props
 * @returns {object} Block controls.
 */
export default function Controls( props ) {
	const { selectedPlanId, onSelected, plans, getPlanDescription } = props;
	const currentPlan = plans.find( plan => plan.id === selectedPlanId );
	let planDescription = null;
	if ( currentPlan ) {
		planDescription = ' ' + getPlanDescription( currentPlan );
	}
	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarItem>
					{ () => (
						<DropdownMenu
							// @ts-ignore We want a label with our Dashicon.Icon
							icon={
								<Fragment>
									<Icon icon={ update } />{ ' ' }
									{ planDescription && <Fragment>{ planDescription }</Fragment> }
								</Fragment>
							}
							label={ __( 'Select a plan', 'jetpack' ) }
							className={ 'premium-content-toolbar-button' }
						>
							{ ( { onClose } ) => (
								<Fragment>
									<Plans
										{ ...props }
										onSelected={ onSelected }
										onClose={ onClose }
										selectedPlan={ currentPlan }
									/>
									<NewPlan { ...props } onClose={ onClose } />
								</Fragment>
							) }
						</DropdownMenu>
					) }
				</ToolbarItem>
			</ToolbarGroup>
		</BlockControls>
	);
}
