/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';
import { numberFormat } from 'components/number-format';

const SingleFeature = ( { amount, description, gridIcon, title } ) => {
	return (
		<div className="jetpack-termination-dialog__feature">
			<div className="jetpack-termination-dialog__feature-header">
				<h3>{ title }</h3>
				<Gridicon icon={ gridIcon } />
			</div>
			<div className="jetpack-termination-dialog__feature-body">
				<p className="jetpack-termination-dialog__feature-body-amount">
					{ numberFormat( amount ) }
				</p>
				<p className="jetpack-termination-dialog__feature-body-description">{ description }</p>
			</div>
		</div>
	);
};

export default SingleFeature;
