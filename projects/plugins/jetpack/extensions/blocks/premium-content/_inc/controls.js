/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { Fragment } from '@wordpress/element';
import { ToolbarDropdownMenu } from '@wordpress/components';
import { update, warning } from '@wordpress/icons';
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

	let subscriptionIcon = update;
	if ( selectedPlanId && ! currentPlan ) {
		planDescription = __( 'Subscription not found', 'jetpack' );
		subscriptionIcon = warning;
	}

	return (
		<BlockControls group="block">
			<ToolbarDropdownMenu
				icon={ subscriptionIcon }
				label={ __( 'Select a plan', 'jetpack' ) }
				text={ planDescription }
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
			</ToolbarDropdownMenu>
		</BlockControls>
	);
}
