import clsx from 'clsx';
import Card from 'components/card';
import { getPlanClass } from 'lib/plans/constants';
import { get } from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { getVaultPressScanThreatCount } from 'state/at-a-glance';
import { isConnectionOwner, isCurrentUserLinked } from 'state/connection';
import {
	switchPlanPreview,
	canDisplayDevCard,
	disableDevCard,
	switchUserPermission,
	switchThreats,
	switchRewindState,
	switchScanState,
} from 'state/dev-version';
import {
	isDevVersion as _isDevVersion,
	userCanViewStats,
	userCanDisconnectSite,
	userCanEditPosts,
} from 'state/initial-state';
import { getRewindStatus } from 'state/rewind';
import { getScanStatus } from 'state/scan';
import { getSitePlan } from 'state/site';
import onKeyDownCallback from 'utils/onkeydown-callback';

export class DevCard extends React.Component {
	static displayName = 'DevCard';

	onPlanChange = event => {
		this.props.switchPlanPreview( event.target.value );
	};

	onPermissionsChange = event => {
		this.props.switchUserPermissions( event.target.value );
	};

	onThreatsChange = event => {
		this.props.switchThreats( event.target.value );
	};

	onRewindStatusChange = event => {
		this.props.switchRewindState( event.target.value );
	};

	onScanStatusChange = event => {
		this.props.switchScanState( event.target.value );
	};

	maybeShowStatsToggle = () => {
		if ( ! this.props.isAdmin ) {
			return (
				<div>
					<hr />
					<ul>
						<li>
							<label htmlFor="view_stats">
								<input
									type="radio"
									id="view_stats"
									value="view_stats"
									name="view_stats"
									checked={ this.props.canViewStats }
									onChange={ this.onPermissionsChange }
								/>
								Can view stats
							</label>
						</li>
						<li>
							<label htmlFor="hide_stats">
								<input
									type="radio"
									id="hide_stats"
									value="hide_stats"
									name="hide_stats"
									checked={ ! this.props.canViewStats }
									onChange={ this.onPermissionsChange }
								/>
								Can not view stats
							</label>
						</li>
					</ul>
				</div>
			);
		}
	};

	showIsLinkedToggle = () => {
		return (
			<div>
				<hr />
				<ul>
					<li>
						<label htmlFor="is_linked">
							<input
								type="radio"
								id="is_linked"
								value="is_linked"
								name="is_linked"
								checked={ this.props.isUserLinked }
								onChange={ this.onPermissionsChange }
							/>
							Linked
						</label>
					</li>
					<li>
						<label htmlFor="is_unlinked">
							<input
								type="radio"
								id="is_unlinked"
								value="is_unlinked"
								name="is_unlinked"
								checked={ ! this.props.isUserLinked }
								onChange={ this.onPermissionsChange }
							/>
							Unlinked
						</label>
					</li>
				</ul>
			</div>
		);
	};

	render() {
		if ( ! this.props.canDisplayDevCard ) {
			return null;
		}

		const classes = clsx( this.props.className, 'jp-dev-card' );

		const planClass = getPlanClass( this.props.sitePlan.product_slug );
		const rewindState = get( this.props.rewindStatus, [ 'state' ], false );
		const scanState = get( this.props.scanStatus, [ 'state' ], false );

		return (
			<Card compact className={ classes }>
				<a
					className="jp-dev-card__close"
					role="button"
					tabIndex="0"
					onKeyDown={ onKeyDownCallback( this.props.disableDevCard ) }
					onClick={ this.props.disableDevCard }
				>
					x
				</a>
				<div className="jp-dev-card__heading">Dev Tools</div>
				<ul>
					<li>
						<label htmlFor="jetpack_free">
							<input
								type="radio"
								id="jetpack_free"
								value="jetpack_free"
								name="jetpack_free"
								checked={ 'is-free-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Free
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_personal">
							<input
								type="radio"
								id="jetpack_personal"
								value="jetpack_personal"
								name="jetpack_personal"
								checked={ 'is-personal-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Personal
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_premium">
							<input
								type="radio"
								id="jetpack_premium"
								value="jetpack_premium"
								name="jetpack_premium"
								checked={ 'is-premium-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Premium
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_business">
							<input
								type="radio"
								id="jetpack_business"
								value="jetpack_business"
								name="jetpack_business"
								checked={ 'is-business-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Pro
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_starter">
							<input
								type="radio"
								id="jetpack_starter"
								value="jetpack_starter_yearly"
								name="jetpack_starter_yearly"
								checked={ 'is-jetpack-starter-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Security (10 GB)
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_security_t1">
							<input
								type="radio"
								id="jetpack_security_t1"
								value="jetpack_security_t1_yearly"
								name="jetpack_security_t1_yearly"
								checked={ 'is-security-t1-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Security (10 GB)
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_security_t2">
							<input
								type="radio"
								id="jetpack_security_t2"
								value="jetpack_security_t2_yearly"
								name="jetpack_security_t2_yearly"
								checked={ 'is-security-t2-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Security (1 TB)
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_complete">
							<input
								type="radio"
								id="jetpack_complete"
								value="jetpack_complete"
								name="jetpack_complete"
								checked={ 'is-complete-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Complete
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_backup_t0">
							<input
								type="radio"
								id="jetpack_backup_t0"
								value="jetpack_backup_t0_yearly"
								name="jetpack_backup_t0_yearly"
								checked={ 'is-backup-t0-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Backup (1 GB)
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_backup_t1">
							<input
								type="radio"
								id="jetpack_backup_t1"
								value="jetpack_backup_t1_yearly"
								name="jetpack_backup_t1_yearly"
								checked={ 'is-backup-t1-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Backup (10 GB)
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_backup_t2">
							<input
								type="radio"
								id="jetpack_backup_t2"
								value="jetpack_backup_t2_yearly"
								name="jetpack_backup_t2_yearly"
								checked={ 'is-backup-t2-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Backup (1 TB)
						</label>
					</li>
					<li className="jp-dev-card__deprecated-plans-list-header">&mdash; DEPRECATED &mdash;</li>
					<li>
						<label htmlFor="jetpack_security_daily">
							<input
								type="radio"
								id="jetpack_security_daily"
								value="jetpack_security_daily"
								name="jetpack_security_daily"
								checked={ 'is-daily-security-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Security Daily
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_security_realtime">
							<input
								type="radio"
								id="jetpack_security_realtime"
								value="jetpack_security_realtime"
								name="jetpack_security_realtime"
								checked={ 'is-realtime-security-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Security Real-Time
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_backup_daily">
							<input
								type="radio"
								id="jetpack_backup_daily"
								value="jetpack_backup_daily"
								name="jetpack_backup_daily"
								checked={ 'is-daily-backup-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Backup Daily
						</label>
					</li>
					<li>
						<label htmlFor="jetpack_backup_realtime">
							<input
								type="radio"
								id="jetpack_backup_realtime"
								value="jetpack_backup_realtime"
								name="jetpack_backup_realtime"
								checked={ 'is-realtime-backup-plan' === planClass }
								onChange={ this.onPlanChange }
							/>
							Backup Real-time
						</label>
					</li>
				</ul>
				<hr />
				<ul>
					<li>
						<label htmlFor="admin_master">
							<input
								type="radio"
								id="admin_master"
								value="admin_master"
								name="admin_master"
								checked={ this.props.isConnectionOwner }
								onChange={ this.onPermissionsChange }
							/>
							Admin (master)
						</label>
					</li>
					<li>
						<label htmlFor="admin_secondary">
							<input
								type="radio"
								id="admin_secondary"
								value="admin_secondary"
								name="admin_secondary"
								checked={ this.props.isAdmin && ! this.props.isConnectionOwner }
								onChange={ this.onPermissionsChange }
							/>
							Admin (secondary)
						</label>
					</li>
					<li>
						<label htmlFor="editor">
							<input
								type="radio"
								id="editor"
								value="editor"
								name="editor"
								checked={ this.props.canEditPosts && ! this.props.isAdmin }
								onChange={ this.onPermissionsChange }
							/>
							Editor
						</label>
					</li>
					<li>
						<label htmlFor="subscriber">
							<input
								type="radio"
								id="subscriber"
								value="subscriber"
								name="subscriber"
								checked={ ! this.props.canEditPosts && ! this.props.isAdmin }
								onChange={ this.onPermissionsChange }
							/>
							Subscriber
						</label>
					</li>
				</ul>
				<hr />
				<ul>
					<li>
						<label htmlFor="nothreats">
							<input
								type="radio"
								id="nothreats"
								value={ 0 }
								name="nothreats"
								checked={ 0 === this.props.getVaultPressScanThreatCount() }
								onChange={ this.onThreatsChange }
							/>
							No threats
						</label>
					</li>
					<li>
						<label htmlFor="threats">
							<input
								type="radio"
								id="threats"
								value={ 17 }
								name="threats"
								checked={ 0 !== this.props.getVaultPressScanThreatCount() }
								onChange={ this.onThreatsChange }
							/>
							Threats
						</label>
					</li>
				</ul>
				<hr />
				<ul>
					<strong>Backup</strong>
					<li>
						<label htmlFor="rewindUnavailable">
							<input
								type="radio"
								id="rewindUnavailable"
								value="unavailable"
								name="unavailable"
								checked={ 'unavailable' === rewindState }
								onChange={ this.onRewindStatusChange }
							/>
							Unavailable
						</label>
					</li>
					<li>
						<label htmlFor="rewindProvisioning">
							<input
								type="radio"
								id="rewindProvisioning"
								value="provisioning"
								name="provisioning"
								checked={ 'provisioning' === rewindState }
								onChange={ this.onRewindStatusChange }
							/>
							Provisioning
						</label>
					</li>
					<li>
						<label htmlFor="rewindAwatingCreds">
							<input
								type="radio"
								id="rewindAwatingCreds"
								value="awaiting_credentials"
								name="awaiting_credentials"
								checked={ 'awaiting_credentials' === rewindState }
								onChange={ this.onRewindStatusChange }
							/>
							Awaiting credentials
						</label>
					</li>
					<li>
						<label htmlFor="rewindActive">
							<input
								type="radio"
								id="rewindActive"
								value="active"
								name="active"
								checked={ 'active' === rewindState }
								onChange={ this.onRewindStatusChange }
							/>
							Active
						</label>
					</li>
				</ul>
				<ul>
					<strong>Scan</strong>
					<li>
						<label htmlFor="scanUnavailable">
							<input
								type="radio"
								id="scanUnavailable"
								value="unavailable"
								name="unavailable"
								checked={ 'unavailable' === scanState }
								onChange={ this.onScanStatusChange }
							/>
							Unavailable
						</label>
					</li>
					<li>
						<label htmlFor="scanProvisioning">
							<input
								type="radio"
								id="scanProvisioning"
								value="provisioning"
								name="provisioning"
								checked={ 'provisioning' === scanState }
								onChange={ this.onScanStatusChange }
							/>
							Provisioning
						</label>
					</li>
					<li>
						<label htmlFor="scanIdle">
							<input
								type="radio"
								id="scanIdle"
								value="idle"
								name="idle"
								checked={ 'idle' === scanState }
								onChange={ this.onScanStatusChange }
							/>
							Idle
						</label>
					</li>
					<li>
						<label htmlFor="scanScanning">
							<input
								type="radio"
								id="scanScanning"
								value="scanning"
								name="scanning"
								checked={ 'scanning' === scanState }
								onChange={ this.onScanStatusChange }
							/>
							Scanning
						</label>
					</li>
				</ul>
				{ this.maybeShowStatsToggle() }
				{ this.showIsLinkedToggle() }
			</Card>
		);
	}
}

export default connect(
	state => {
		return {
			isDevVersion: _isDevVersion( state ),
			sitePlan: getSitePlan( state ),
			canDisplayDevCard: canDisplayDevCard( state ),
			isUserLinked: isCurrentUserLinked( state ),
			canViewStats: userCanViewStats( state ),
			isConnectionOwner: isConnectionOwner( state ),
			isAdmin: userCanDisconnectSite( state ),
			canEditPosts: userCanEditPosts( state ),
			getVaultPressScanThreatCount: () => getVaultPressScanThreatCount( state ),
			rewindStatus: getRewindStatus( state ),
			scanStatus: getScanStatus( state ),
		};
	},
	dispatch => {
		return {
			switchPlanPreview: slug => {
				return dispatch( switchPlanPreview( slug ) );
			},
			switchUserPermissions: slug => {
				return dispatch( switchUserPermission( slug ) );
			},
			switchThreats: count => {
				return dispatch( switchThreats( parseInt( count ) ) );
			},
			disableDevCard: () => {
				return dispatch( disableDevCard() );
			},
			switchRewindState: rewindState => {
				return dispatch( switchRewindState( rewindState ) );
			},
			switchScanState: scanState => dispatch( switchScanState( scanState ) ),
		};
	}
)( DevCard );
