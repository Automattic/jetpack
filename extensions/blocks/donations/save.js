/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const Save = ( { attributes } ) => {
	const { oneTimePlanId, monthlyPlanId, annuallyPlanId } = attributes;

	if ( ! oneTimePlanId || oneTimePlanId === -1 ) {
		return null;
	}

	const tabs = {
		'one-time': { title: __( 'One-Time', 'jetpack' ) },
		...( monthlyPlanId && { '1 month': { title: __( 'Monthly', 'jetpack' ) } } ),
		...( annuallyPlanId && { '1 year': { title: __( 'Yearly', 'jetpack' ) } } ),
	};

	return (
		<div>
			<div className="donations__container">
				{ Object.keys( tabs ).length > 1 && (
					<div className="donations__nav">
						{ Object.entries( tabs ).map( ( [ interval, { title } ] ) => (
							<Button
								className="donations__nav-item"
								key={ `jetpack-donations-nav-item-${ interval } ` }
							>
								{ title }
							</Button>
						) ) }
					</div>
				) }
				<div className="donations__content">
					<div className="donations__tab">
						<InnerBlocks.Content />
					</div>
				</div>
			</div>
		</div>
	);
};

export default Save;
