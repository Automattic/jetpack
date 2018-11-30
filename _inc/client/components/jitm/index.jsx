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
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isActivatingModule,
} from 'state/modules';
import Button from 'components/button';
import { getJitm } from 'state/jitm';

// to-do: bring in scss from jetpack-admin-jitm.scss. No need for now, but will be needed once we dequeue JITMs on the JP dashboard.

class Jitm extends Component {
	componentDidMount() {
		analytics.tracks.recordEvent(
			'jetpack_jitm_view',
			// to-do: this does not work as we do not have the data when the component loads.
			{ version: this.props.Jitm.id }
		);
	}

	trackLearnMore = ( feature_class ) => {
		analytics.tracks.recordEvent(
			// to-do: set the right name and prop for that event.
			'jetpack_jitm_view',
			{ version: feature_class }
		);
	};

	renderListItem = ( list, id, feature_class ) => {
		for ( const i of list ) {
			const { item, url } = i;
			let text = item;

			if ( url ) {
				// to-do: test this. Could not find an active JITM using lists right now. Tracks is going to have to be reimplemented anyway.
				text = `<a
					href=${ url }
					target="_blank" rel="noopener noreferrer"
					data-module=${ feature_class }
					data-jptracks-name="nudge_item_click"
					data-jptracks-prop="jitm-${ id }"
				>
					${ item }
				</a>`;
			}

			return (
				<li>
					<svg class="gridicon gridicons-checkmark" height="16" width="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
						<g><path d="M9 19.414l-6.707-6.707 1.414-1.414L9 16.586 20.293 5.293l1.414 1.414" /></g>
					</svg>
					{ text }
				</li>
			);
		}
	};

	activateModule = ( module_slug ) => {
		this.props.activateModule( module_slug );
		// to-do: Maybe add tracking here if needed, not sure if activateModule triggers those already.
		// something like
		// analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
		// 	module: module_slug,
		// 	toggled: 'on'
		// } );
	};

	render() {
		const jitm = this.props.Jitm;

		// to-do: I am not familiar enough with lodash yet, but there may be a way to combine some of those calls.
		const activate_module = get( jitm, 'activate_module', null );

		const cta = get( jitm, 'CTA', null );
		const ctaMessage = get( cta, 'message', null );
		// const ctaNewWindow = get( cta, 'newWindow', null );
		const ctaPrimary = get( cta, 'primary', null );

		const description = get( jitm, 'content.description', null );
		const feature_class = get( jitm, 'feature_class', '' );
		const icon = get( jitm, 'content.icon', '' );
		const id = get( jitm, 'id', '' );
		const list = get( jitm, 'content.list', null );
		const mainClasses = classnames(
			'jitm-card jitm-banner is-upgrade-premium',
			{ 'has-call-to-action': ctaMessage ? true : false },
			get( jitm, 'content.classes', '' )
		);
		const title = get( jitm, 'content.message', '' );
		const url = get( jitm, 'url', '' );

		return (
			<div>
				{ ! isEmpty( jitm ) &&
					<div className={ mainClasses }>
						<div
							className="jitm-banner__icon-plan"
							/*eslint-disable react/no-danger*/
							dangerouslySetInnerHTML={ { __html: icon } }
						/>
						<div className="jitm-banner__content">
							<div className="jitm-banner__info">
								<div className="jitm-banner__title">{ title }</div>
								{ description &&
									<div className="jitm-banner__description">
										{ description }
										{ list.length > 0 &&
											<ul className="banner__list">
												{ this.renderListItem( list, id, feature_class ) }
											</ul>
										}
									</div>
								}
							</div>
							{ activate_module &&
								<div className="jitm-banner__action" id="jitm-banner__activate">
									<Button
										className="jitm-button"
										primary={ true }
										compact={ true }
										onClick={ this.activateModule( activate_module ) }
										disabled={ this.props.isActivatingModule( activate_module ) }
									>
										{ this.props.isActivatingModule( activate_module ) ? __( 'Activating' ) : __( 'Activate' ) }
									</Button>
								</div>
							}
							{ ctaMessage &&
								<div className="jitm-banner__action">
									<Button
										// to-do: missing the option to open in a new window with the ctaNewWindow const.
										// target={ ctaNewWindow === false ? '_self' : '_blank' }
										href={ url }
										className="jitm-button"
										primary={ activate_module === null && ctaPrimary ? true : false }
										compact={ true }
										onClick={ this.trackLearnMore( feature_class ) }s
									>
										{ ctaMessage }
									</Button>
								</div>
							}
							{ /* to-do: replace a by button or svg icon */ }
							<a
								data-module={ feature_class }
								className="jitm-banner__dismiss">
							</a>
						</div>
					</div>
				}
			</div>
		);
	}
}

Jitm.propTypes = {
	Jitm: PropTypes.object.isRequired,
};

Jitm.defaultProps = {
	Jitm: {},
};

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_slug ) => _isModuleActivated( state, module_slug ),
			isActivatingModule: ( module_slug ) => isActivatingModule( state, module_slug ),
			Jitm: getJitm( state ),
		};
	},
	( dispatch ) => {
		return {
			activateModule: ( slug ) => {
				return dispatch( activateModule( slug ) );
			}
		};
	}
)( Jitm );
