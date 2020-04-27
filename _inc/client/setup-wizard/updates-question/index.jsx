/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';

const UpdatesQuestion = props => {
	return (
		<div className="jp-setup-wizard-main">
			<img
				width="200px"
				height="200px"
				src={ imagePath + '/jetpack-publicize-with-tumblr.svg' }
				alt={ __( 'A jetpack site using publicize to share posts' ) }
			/>
			<h1>
				{ __( 'Will %(siteTitle)s have blog posts, news, or regular updates?', {
					args: { siteTitle: props.siteTitle },
				} ) }
			</h1>
		</div>
	);
};

export { UpdatesQuestion };
