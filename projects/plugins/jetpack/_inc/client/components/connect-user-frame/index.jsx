/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AuthIframe from 'components/auth-iframe';
import Gridicon from 'components/gridicon';
import './style.scss';

const ConnectUserFrame = props => {
	return (
		<div className="jp-connect-user-frame">
			<div className="jp-connect-user-frame__left">
				{ props.featureLabel ? (
					<h2>
						{ sprintf(
							/* translators: placeholder is a feature label (e.g. SEO, Notifications) */
							__( 'Unlock %s and other features', 'jetpack' ),
							props.featureLabel
						) }
					</h2>
				) : (
					<h2>{ __( 'Unlock this and other features', 'jetpack' ) }</h2>
				) }

				<ul>
					<li>
						<Gridicon icon="checkmark-circle" />{ ' ' }
						{ __( 'Receive instant downtime alerts', 'jetpack' ) }
					</li>
					<li>
						<Gridicon icon="checkmark-circle" />{ ' ' }
						{ __( 'Automatically promote your posts on social media', 'jetpack' ) }
					</li>
					<li>
						<Gridicon icon="checkmark-circle" />{ ' ' }
						{ __( 'Let your subscribers know when you post', 'jetpack' ) }
					</li>
					<li>
						<Gridicon icon="checkmark-circle" />{ ' ' }
						{ __( 'Receive notifications of likes and comments', 'jetpack' ) }
					</li>
					<li>
						<Gridicon icon="checkmark-circle" />{ ' ' }
						{ __( 'Let visitors easily share your content', 'jetpack' ) }
					</li>
				</ul>

				<p>
					<a
						className="jp-connect-user-frame__features-link"
						target="_blank"
						rel="noreferrer"
						href="https://jetpack.com/support/features/"
					>
						{ __( 'See all Jetpack features', 'jetpack' ) }
						<svg width="16" height="16" viewBox="0 0 24 24" className="gridicon gridicons-external">
							<g>
								<path d="M19 13v6c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h6v2H5v12h12v-6h2zM13 3v2h4.586l-7.793 7.793 1.414 1.414L19 6.414V11h2V3h-8z"></path>
							</g>
						</svg>
					</a>
				</p>
			</div>

			<div className="jp-connect-user-frame__right">
				<AuthIframe
					scrollToIframe={ false }
					title=""
					width="347"
					height="353"
					location={ props.source }
				/>
			</div>
		</div>
	);
};

ConnectUserFrame.propTypes = {
	source: PropTypes.string,
	featureLabel: PropTypes.string,
};

export default ConnectUserFrame;
