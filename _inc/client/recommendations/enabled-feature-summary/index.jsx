/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { getFeatureCopy } from '../feature-utils';
import Gridicon from 'components/gridicon';

const EnabledFeatureSummary = props => {
	const { featureSlug } = props;

	const { configureButtonLabel, displayName } = getFeatureCopy( featureSlug );

	return (
		<div>
			<Gridicon icon="checkmark-circle" size={ 24 } />
			<div>{ displayName }</div>
			<Button>{ configureButtonLabel }</Button>
		</div>
	);
};
