/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import JetpackBanner from 'components/jetpack-banner';

import './style.scss';

class ModuleOverridenBanner extends JetpackBanner {
	static propTypes = {
		moduleName: PropTypes.string.isRequired,
	};

	render() {
		// There's no point in showing a banner that tells the user a module has been disabled
		// if it doesn't mention the module name. :)
		if ( ! this.props.moduleName ) {
			return null;
		}

		const classes = classNames( 'module-overridden-banner', {
			'is-compact': this.props.compact,
		} );

		return (
			<JetpackBanner
				className={ classes }
				title={ this.props.moduleName }
				icon="cog"
				description={ createInterpolateElement(
					sprintf(
						/* translators: placeholder is a feature name. */
						__(
							'%s has been disabled by a site administrator. <link>Learn more</link>.',
							'jetpack'
						),
						this.props.moduleName
					),
					{
						link: (
							<a
								href={ getRedirectUrl( 'jetpack-support-module-overrides' ) }
								target="_blank"
								rel="noopener noreferrer"
							/>
						),
					}
				) }
			/>
		);
	}
}

export default ModuleOverridenBanner;
