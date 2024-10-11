import { getRedirectUrl, numberFormat } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import DashItem from 'components/dash-item';
import QueryProtectCount from 'components/data/query-dash-protect';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { getProtectCount } from 'state/at-a-glance';
import { isOfflineMode, connectUser } from 'state/connection';
import { isModuleAvailable } from 'state/modules';

class DashProtect extends Component {
	static propTypes = {
		isOfflineMode: PropTypes.bool.isRequired,
		protectCount: PropTypes.any.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
		connectUser: PropTypes.func.isRequired,
	};

	activateProtect = () => this.props.updateOptions( { protect: true } );

	connect = () => this.props.connectUser();

	getContent() {
		const labelName = __( 'Brute force protection', 'jetpack' );
		const support = {
			text: __(
				'Protects your site from traditional and distributed brute force login attacks.',
				'jetpack'
			),
			link: getRedirectUrl( 'jetpack-support-protect' ),
		};

		if ( this.props.getOptionValue( 'protect' ) && ! this.props.isOfflineMode ) {
			const protectCount = this.props.protectCount;

			if ( 'N/A' === protectCount ) {
				return (
					<DashItem label={ labelName } module="protect" support={ support }>
						<p className="jp-dash-item__description">{ __( 'Loading…', 'jetpack' ) }</p>
					</DashItem>
				);
			}

			if ( 0 === protectCount ) {
				return (
					<DashItem
						label={ labelName }
						module="protect"
						support={ support }
						status="is-working"
						className="jp-dash-item__recently-activated"
					>
						<div className="jp-dash-item__recently-activated-lower">
							<QueryProtectCount />
							<p className="jp-dash-item__description">
								{ __(
									'Jetpack is actively blocking malicious login attempts. Data will display here soon!',
									'jetpack'
								) }
							</p>
						</div>
					</DashItem>
				);
			}

			return (
				<DashItem label={ labelName } module="protect" support={ support } status="is-working">
					<h2 className="jp-dash-item__count">{ numberFormat( protectCount ) }</h2>
					<p className="jp-dash-item__description">
						{ __( 'Total malicious attacks blocked on your site.', 'jetpack' ) }
					</p>
				</DashItem>
			);
		}

		return (
			<DashItem
				label={ labelName }
				module="protect"
				support={ support }
				className="jp-dash-item__is-inactive"
			>
				<p className="jp-dash-item__description">
					{ this.props.isOfflineMode && __( 'Unavailable in Offline Mode', 'jetpack' ) }

					{ ! this.props.isOfflineMode &&
						createInterpolateElement(
							__(
								'<Button>Activate Protect</Button> to keep your site protected from malicious sign in attempts.',
								'jetpack'
							),
							{
								Button: <Button className="jp-link-button" onClick={ this.activateProtect } />,
							}
						) }
				</p>
			</DashItem>
		);
	}

	render() {
		return (
			this.props.isModuleAvailable && (
				<div className="jp-dash-item__interior">
					<QueryProtectCount isActive={ this.props.getOptionValue( 'protect' ) } />
					{ this.getContent() }
				</div>
			)
		);
	}
}

export default connect(
	state => ( {
		protectCount: getProtectCount( state ),
		isOfflineMode: isOfflineMode( state ),
		isModuleAvailable: isModuleAvailable( state, 'protect' ),
	} ),
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashProtect );
