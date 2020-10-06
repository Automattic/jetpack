/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { InspectorControls, BlockContextProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import UpgradePlanBanner from './upgrade-plan-banner';
import { getRequiredPlan } from '../../shared/plan-utils';
import { trackUpgradeClickEvent } from './utils';

export default OriginalBlockEdit => props => {
	const requiredPlan = getRequiredPlan( props?.name )
	console.log('props original block editzzz', props)
	console.log('original', OriginalBlockEdit)
	console.log( 'requiredPlan', requiredPlan );
	console.log( 'props.name', props.name );
	if ( ! requiredPlan ) {
		return <OriginalBlockEdit { ...props } />;
	}
	const bannerContext = 'sidebar';

	return (
		<Fragment>
			<InspectorControls>
				<UpgradePlanBanner
					description={ null }
					requiredPlan={ requiredPlan }
					context={ bannerContext }
					onRedirect={ () =>
						trackUpgradeClickEvent( {
							plan: requiredPlan,
							blockName: props.name,
							context: bannerContext,
						} )
					}
				/>
			</InspectorControls>
			<BlockContextProvider value="bloo" blah="asdf" parentRequiredPlan={requiredPlan}>
			  <OriginalBlockEdit { ...props } />
			</BlockContextProvider>
		</Fragment>
	);
};
