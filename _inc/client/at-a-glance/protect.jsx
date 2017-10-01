/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { numberFormat, translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import QueryProtectCount from 'components/data/query-dash-protect';
import { getModules } from 'state/modules';
import { getProtectCount } from 'state/at-a-glance';
import { isDevMode } from 'state/connection';

class DashProtect extends Component {
	getContent() {
		const activateProtect = () => this.props.updateOptions( { 'protect': true } );

		if ( this.props.getOptionValue( 'protect' ) ) {
			const protectCount = this.props.protectCount;

			if ( false === protectCount || '0' === protectCount || 'N/A' === protectCount ) {
				return (
					<DashItem
						label="Protect"
						module="protect"
						status="is-working"
						className="jp-dash-item__recently-activated"
					>
						<div className="jp-dash-item__recently-activated-lower">
							<QueryProtectCount />
							<p className="jp-dash-item__description">{ __( 'Jetpack is actively blocking malicious login attempts. Data will display here soon!' ) }</p>
						</div>
					</DashItem>
				);
			}
			return (
				<DashItem
					label="Protect"
					module="protect"
					status="is-working"
				>
					<h2 className="jp-dash-item__count">{ numberFormat( protectCount ) }</h2>
					<p className="jp-dash-item__description">{ __( 'Total malicious attacks blocked on your site.' ) }</p>
				</DashItem>
			);
		}

		return (
			<DashItem
				label="Protect"
				module="protect"
				className="jp-dash-item__is-inactive"
			>
				<p className="jp-dash-item__description">{
					this.props.isDevMode ? __( 'Unavailable in Dev Mode' )
						: __( '{{a}}Activate Protect{{/a}} to keep your site protected from malicious sign in attempts.', {
							components: {
								a: <a href="javascript:void(0)" onClick={ activateProtect } />
							}
						}
					)
				}</p>
			</DashItem>
		);
	}

	render() {
		const moduleList = Object.keys( this.props.moduleList );
		if ( ! includes( moduleList, 'protect' ) ) {
			return null;
		}

		return (
			<div className="jp-dash-item__interior">
				<QueryProtectCount />
				{ this.getContent() }
			</div>
		);
	}
}

DashProtect.propTypes = {
	isDevMode: React.PropTypes.bool.isRequired,
	protectCount: React.PropTypes.any.isRequired
};

export default connect(
	( state ) => {
		return {
			protectCount: getProtectCount( state ),
			isDevMode: isDevMode( state ),
			moduleList: getModules( state )
		};
	}
)( DashProtect );
