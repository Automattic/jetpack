/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Gridicon from 'components/gridicon';

const SettingsGroup = props => {
	let support = props.support
		? props.support
		: false;

	return (
		<Card className={ classNames( 'jp-form-settings-group', { 'jp-form-has-child': props.hasChild } ) }>
			{
				support
					? <div className="jp-module-settings__learn-more">
						<Button borderless compact href={ support }>
							<Gridicon icon="help-outline" />
							<span className="screen-reader-text">{ __( 'Learn More' ) }</span>
						</Button>
					  </div>
					: ''
			}
			{ props.children }
		</Card>
	);
};

export default SettingsGroup;