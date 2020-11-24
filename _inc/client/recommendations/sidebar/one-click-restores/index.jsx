/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React from 'react';

/**
 * Internal dependencies
 */
import { Layout } from '../layout';
import Button from 'components/button';
import ExternalLink from 'components/external-link';
import { imagePath } from 'constants/urls';

/**
 * Style dependencies
 */
import './style.scss';

const OneClickRestores = () => {
	// TODO: realtime/daily backups text
	// TODO: button href
	return (
		<Layout
			illustrationPath={ imagePath + '/recommendations/one-click-restores.svg' }
			content={
				<div className="jp-recommendations-one-click-restores">
					<h2>{ __( 'Enable one-click restores' ) }</h2>
					<p>
						{ __(
							'Get the most out of your {Real-time Backups}. One-click restores ensure we’ll be able to easily restore your site, if anything goes wrong.'
						) }
					</p>
					<p>
						{ __(
							'Enter your server credentials to enable one-click restores included in your plan.'
						) }
					</p>
					<div className="jp-recommendations-one-click-restores__cta">
						<Button primary>{ __( 'Enable one-click restores' ) }</Button>
						<ExternalLink icon={ true }>{ __( 'Find your server credentials' ) }</ExternalLink>
					</div>
				</div>
			}
		/>
	);
};

export { OneClickRestores };
