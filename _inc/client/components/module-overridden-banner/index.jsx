/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import classNames from 'classnames';

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

		const translationArgs = {
			args: {
				moduleName: this.props.moduleName,
			},
			components: {
				link: (
					<a
						href="http://jetpack.com/support/module-overrides/"
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			},
		};

		const classes = classNames( 'module-overridden-banner', {
			'is-compact': this.props.compact,
		} );

		return (
			<JetpackBanner
				className={ classes }
				title={ this.props.moduleName }
				icon="cog"
				description={ __(
					'%(moduleName)s has been disabled by a site administrator. {{link}}Learn more{{/link}}.',
					translationArgs
				) }
			/>
		);
	}
}

export default ModuleOverridenBanner;
