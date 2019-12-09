/**
 * External dependencies
 */
import React from 'react';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import ButtonGroup from 'components/button-group';

export default function PlanSwitcher( { period, periods, setPeriod } ) {
	return (
		<div className="plan-grid-period">
			<ButtonGroup>
				{ map( periods, ( periodLabel, periodName ) => (
					<Button
						key={ 'plan-period-button-' + periodName }
						primary={ periodName === period }
						onClick={ setPeriod( periodName ) }
						compact
					>
						{ periodLabel }
					</Button>
				) ) }
			</ButtonGroup>
		</div>
	);
}
