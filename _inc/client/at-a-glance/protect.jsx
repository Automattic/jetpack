/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { numberFormat, translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import QueryProtectCount from 'components/data/query-dash-protect';
import { isModuleAvailable } from 'state/modules';
import { getProtectCount } from 'state/at-a-glance';
import { isDevMode } from 'state/connection';

class DashProtect extends Component {
	static propTypes = {
		isDevMode: PropTypes.bool.isRequired,
		protectCount: PropTypes.any.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
	};

	getContent() {
		const support = {
			text: __( 'Protects your site from traditional and distributed brute force login attacks.' ),
			link: 'https://jetpack.com/support/protect/',
		};
		const activateProtect = () => this.props.updateOptions( { protect: true } );

		if ( this.props.getOptionValue( 'protect' ) ) {
			const protectCount = this.props.protectCount;

			if ( false === protectCount || '0' === protectCount || 'N/A' === protectCount ) {
				return (
					<DashItem
						label="Protect"
						module="protect"
						support={ support }
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
					support={ support }
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
				support={ support }
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
		return this.props.isModuleAvailable && (
			<div className="jp-dash-item__interior">
				<QueryProtectCount />
				{ this.getContent() }
			</div>
		);
	}
}

export default connect(
	state => ( {
		protectCount: getProtectCount( state ),
		isDevMode: isDevMode( state ),
		isModuleAvailable: isModuleAvailable( state, 'protect' ),
	} )
)( DashProtect );
