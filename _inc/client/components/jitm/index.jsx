/**
 * External dependencies
 */
import classnames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import decodeEntities from 'lib/decode-entities';
import Gridicon from 'components/gridicon';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isActivatingModule
} from 'state/modules';
import {
	getJitmDismissalResponse,
	getJitm,
	isDismissingJitm,
	isFetchingJitm
} from 'state/jitm';

require( './../../../../scss/jetpack-admin-jitm.scss' );

class Jitm extends Component {
	state = { showJitm: true };

	handleModuleActivation = ( module_slug, id ) => () => {
		this.props.activateModule( module_slug );

		// Track module activation.
		analytics.tracks.recordEvent( 'jetpack_nudge_click', {
			click: `jitm-${ id }-activate_module`
		} );
	};

	handleDismissal = () => {
		const jitm = this.props.Jitm;
		const feature_class = get( jitm, 'feature_class', '' );
		const id = get( jitm, 'id', '' );

		if ( ! this.props.isDismissingJitm ) {
			this.props.getJitmDismissalResponse( id, feature_class );

			this.setState( { showJitm: false } );
		}
	};

	trackClick = () => {
		const jitm = this.props.Jitm;
		const id = get( jitm, 'id', '' );

		analytics.tracks.recordEvent( 'jetpack_nudge_click', {
			click: `jitm-${ id }`
		} );
	};

	trackListClick = () => {
		const jitm = this.props.Jitm;
		const id = get( jitm, 'id', '' );

		analytics.tracks.recordEvent( 'jetpack_nudge_item_click', {
			click: `jitm-${ id }`,
		} );
	};

	renderListItem = ( listItem ) => {
		const { item, url } = listItem;
		let text = decodeEntities( item );
		if ( url ) {
			text = (
				<a
					href={ url }
					onClick={ this.trackListClick }
					rel={ 'noopener noreferrer' }
					target={ '_blank' }
				>
					{ decodeEntities( item ) }
				</a>
			);
		}

		return (
			<li key={ item } >
				<Gridicon icon="checkmark" size={ 16 } />
				{ text }
			</li>
		);
	};

	renderContent = () => {
		const jitm = this.props.Jitm;

		const activate_module = get( jitm, 'activate_module', null );

		const cta = get( jitm, 'CTA', null );
		const ctaMessage = get( cta, 'message', null );
		const ctaNewWindow = get( cta, 'newWindow', null );
		const ctaPrimary = get( cta, 'primary', null );

		const description = get( jitm, 'content.description', null );
		const icon = get( jitm, 'content.icon', '' );
		const id = get( jitm, 'id', '' );
		const list = get( jitm, 'content.list', null );
		const mainClasses = classnames(
			'jitm-card jitm-banner is-upgrade-premium',
			{ 'has-call-to-action': ctaMessage ? true : false },
			get( jitm, 'content.classes', '' )
		);
		const title = get( jitm, 'content.message', '' );
		const url = `${ get( jitm, 'url', '' ) }&redirect=%2Fwp-admin%2Fadmin.php%3Fpage%3Djetpack`;

		return (
			<div>
				{! isEmpty( jitm ) && (
					<div className={ mainClasses }>
						<div
							className="jitm-banner__icon-plan"
							/*eslint-disable react/no-danger*/
							dangerouslySetInnerHTML={ { __html: icon } }
						/>
						<div className="jitm-banner__content">
							<div className="jitm-banner__info">
								<div className="jitm-banner__title">
									{decodeEntities( title )}
								</div>
								{description && (
									<div className="jitm-banner__description">
										{ decodeEntities( description ) }
										{ list && list.length &&
											<ul className="banner__list">
												{ list.map( listItem => this.renderListItem( listItem ) ) }
											</ul>
										}
									</div>
								) }
							</div>
							{ activate_module && ! this.props.isModuleActivated &&
								<div className="jitm-banner__action" id="jitm-banner__activate">
									<Button
										className="jitm-button"
										primary={ true }
										compact={ true }
										onClick={ this.handleModuleActivation( activate_module, id ) }
										disabled={ this.props.isActivatingModule }
									>
										{this.props.isActivatingModule
											? __( 'Activating' )
											: __( 'Activate' )}
									</Button>
								</div>
							}
							{ctaMessage && (
								<div className="jitm-banner__action">
									<a
										target={ ctaNewWindow === false ? '_self' : '_blank' }
										href={ url }
										className={ `jitm-button dops-button is-compact ${ activate_module === null && ctaPrimary ? 'is-primary' : false }` }
										onClick={ this.trackClick }
									>
										{decodeEntities( ctaMessage )}
									</a>
								</div>
							)}
							<Gridicon
								className="jitm-banner__dismiss"
								onClick={ this.handleDismissal }
								icon="cross-small"
								size={ 16 }
							/>
						</div>
					</div>
				)}
			</div>
		);
	};

	render() {
		return (
			<div>
				{ this.state.showJitm && ! this.props.isFetchingJitm ? this.renderContent() : null }
			</div>
		);
	}
}

Jitm.propTypes = {
	isActivatingModule: PropTypes.bool,
	isDismissingJitm: PropTypes.bool,
	isFetchingJitm: PropTypes.bool,
	isModuleActivated: PropTypes.bool,
	Jitm: PropTypes.object.isRequired
};

Jitm.defaultProps = {
	isActivatingModule: false,
	isDismissingJitm: false,
	isFetchingJitm: false,
	isModuleActivated: false,
	Jitm: {}
};

export default connect(
	( state ) => {
		const jitm = getJitm( state );
		const module_slug = get( jitm, 'activate_module', null );
		return {
			isDismissingJitm: isDismissingJitm( state ),
			isFetchingJitm: isFetchingJitm( state ),
			isModuleActivated: _isModuleActivated( state, module_slug ),
			isActivatingModule: isActivatingModule( state, module_slug ),
			Jitm: jitm
		};
	},
	dispatch => {
		return {
			activateModule: slug => {
				return dispatch( activateModule( slug ) );
			},
			getJitmDismissalResponse: ( id = '', feature_class = '' ) => {
				if ( '' !== id && '' !== feature_class ) {
					return dispatch( getJitmDismissalResponse( id, feature_class ) );
				}
			}
		};
	}
)( Jitm );
