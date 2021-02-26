/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Spinner from 'components/spinner';

/**
 * Style dependencies
 */
import './style.scss';

const InstallButton = props => {
	const { isInstalling = false, children = null, ...rest } = props;

	const buttonContent = isInstalling ? (
		<div className="jp-install-button__spinner-container">
			<Spinner />
		</div>
	) : (
		children
	);

	return <Button { ...rest }>{ buttonContent }</Button>;
};

export default InstallButton;
