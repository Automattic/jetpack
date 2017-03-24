/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import {
	isDevVersion as _isDevVersion,
	userCanViewStats,
	userIsMaster,
	userCanDisconnectSite,
	userCanEditPosts
} from 'state/initial-state';
import { getSitePlan } from 'state/site';
import { isCurrentUserLinked } from 'state/connection';
import {
	switchPlanPreview,
	canDisplayDevCard,
	disableDevCard,
	switchUserPermission,
	switchThreats
} from 'state/dev-version';
import { getVaultPressScanThreatCount } from 'state/at-a-glance';
import Card from 'components/card';
import onKeyDownCallback from 'utils/onkeydown-callback';

export const DevCard = React.createClass( {
	displayName: 'DevCard',

	onPlanChange( event ) {
		this.props.switchPlanPreview( event.target.value );
	},

	onPermissionsChange( event ) {
		this.props.switchUserPermissions( event.target.value );
	},

	onThreatsChange( event ) {
		this.props.switchThreats( event.target.value );
	},

	maybeShowStatsToggle() {
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
	},

	maybeShowIsLinkedToggle() {
		if ( ! this.props.isMaster ) {
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
		}
	},

	render() {
		if ( ! this.props.canDisplayDevCard ) {
			return null;
		}

		const classes = classNames(
			this.props.className,
			'jp-dev-card'
		);

		return (
			<Card compact className={ classes }>
				<a
					className="jp-dev-card__close"
					role="button"
					tabIndex="0"
					onKeyDown={ onKeyDownCallback( this.props.disableDevCard ) }
					onClick={ this.props.disableDevCard }>x</a>
				<div className="jp-dev-card__heading">Dev Tools</div>
				<ul>
					<li>
						<label htmlFor="jetpack_free">
							<input
								type="radio"
								id="jetpack_free"
								value="jetpack_free"
								name="jetpack_free"
								checked={ 'jetpack_free' === this.props.sitePlan.product_slug }
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
								checked={ /jetpack_personal*/.test( this.props.sitePlan.product_slug ) }
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
								checked={ /jetpack_premium*/.test( this.props.sitePlan.product_slug ) }
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
								checked={ /jetpack_business*/.test( this.props.sitePlan.product_slug ) }
								onChange={ this.onPlanChange }
							/>
							Pro
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
								checked={ this.props.isMaster }
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
								checked={ this.props.isAdmin && ! this.props.isMaster }
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
				{ this.maybeShowStatsToggle() }
				{ this.maybeShowIsLinkedToggle() }
			</Card>
		);
	}
} );

export default connect(
	state => {
		return {
			isDevVersion: _isDevVersion( state ),
			sitePlan: getSitePlan( state ),
			canDisplayDevCard: canDisplayDevCard( state ),
			isUserLinked: isCurrentUserLinked( state ),
			canViewStats: userCanViewStats( state ),
			isMaster: userIsMaster( state ),
			isAdmin: userCanDisconnectSite( state ),
			canEditPosts: userCanEditPosts( state ),
			getVaultPressScanThreatCount: () => getVaultPressScanThreatCount( state )
		};
	},
	( dispatch ) => {
		return {
			switchPlanPreview: ( slug ) => {
				return dispatch( switchPlanPreview( slug ) );
			},
			switchUserPermissions: ( slug ) => {
				return dispatch( switchUserPermission( slug ) );
			},
			switchThreats: count => {
				return dispatch( switchThreats( parseInt( count ) ) );
			},
			disableDevCard: () => {
				return dispatch( disableDevCard() );
			}
		};
	}
)( DevCard );
