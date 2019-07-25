/**
 * External dependencies
 */
import Gridicon from 'components/gridicon';
import React from 'react';

const SingleFeature = ( { title, amount, description, gridIcon } ) => {
	return (
		<div className="jetpack-disconnect-dialog__feature">
			<div className="jetpack-disconnect-dialog__feature-header">
				<h3>{ title }</h3>
				<Gridicon icon={ gridIcon } />
			</div>
			<div className="jetpack-disconnect-dialog__feature-body">
				<h2>{ amount }</h2>
				<p>{ description }</p>
			</div>
		</div>
	);
};

export default SingleFeature;
