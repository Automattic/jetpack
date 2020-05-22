/**
 * External dependencies
 */
import { numberFormat } from 'i18n-calypso';
import Gridicon from 'components/gridicon';
import React from 'react';

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
