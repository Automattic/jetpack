/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { imagePath } from 'constants/urls';

import './style.scss';

const UpdatesQuestion = props => {
	return (
		<div className="jp-setup-wizard-main jp-setup-wizard-updates-main">
			<img
				src={ imagePath + 'jetpack-publicize-1.svg' }
				alt={ __( 'A jetpack site using publicize to share posts' ) }
			/>
			<h1>
				{ __( 'Will %(siteTitle)s have blog posts, news, or regular updates?', {
					args: { siteTitle: props.siteTitle },
				} ) }
			</h1>
			<div className="jp-setup-wizard-updates-answer-buttons-container">
				<Button href="" primary className="jp-setup-wizard-updates-button">
					{ __( 'Yes' ) }
				</Button>
				<Button href="" className="jp-setup-wizard-updates-button">
					{ __( 'No' ) }
				</Button>
			</div>
			<a className="jp-setup-wizard-skip-link" href="">
				{ __( 'Skip' ) }
			</a>
		</div>
	);
};

export { UpdatesQuestion };
