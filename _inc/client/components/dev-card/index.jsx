/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { isDevVersion as _isDevVersion } from 'state/initial-state';
import { switchPlanPreview } from 'state/dev-version';
import { getSitePlan } from 'state/site';
import { canDisplayDevCard, disableDevCard } from 'state/dev-version';
import Card from 'components/card';

export const DevCard = React.createClass( {
	displayName: 'DevCard',

	onChange( event ) {
		this.props.switchPlanPreview( event.target.value );
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
				<a className="jp-dev-card__close" onClick={ this.props.disableDevCard }>x</a>
				<div className="jp-dev-card__heading">Plan preview</div>
				<div className="jp-dev-card__subheading">(Dev only)</div>
				<ul>
					<li>
						<label>
							<input
								type='radio'
								id='jetpack_free'
								value='jetpack_free'
								name='jetpack_free'
								checked={ 'jetpack_free' === this.props.sitePlan.product_slug }
								onChange={ this.onChange }
							/>
							Free
						</label>
					</li>
					<li>
						<label>
							<input
								type='radio'
								id='jetpack_personal'
								value='jetpack_personal'
								name='jetpack_personal'
								checked={ /jetpack_personal*/.test( this.props.sitePlan.product_slug ) }
								onChange={ this.onChange }
							/>
							Personal
						</label>
					</li>
					<li>
						<label>
							<input
								type='radio'
								id='jetpack_premium'
								value='jetpack_premium'
								name='jetpack_premium'
								checked={ /jetpack_premium*/.test( this.props.sitePlan.product_slug ) }
								onChange={ this.onChange }
							/>
							Premium
						</label>
					</li>
					<li>
						<label>
						<input
								type='radio'
								id='jetpack_business'
								value='jetpack_business'
								name='jetpack_business'
								checked={ /jetpack_business*/.test( this.props.sitePlan.product_slug ) }
								onChange={ this.onChange }
							/>
							Pro
						</label>
					</li>
				</ul>
			</Card>
		);
	}
} );

export default connect(
	state => {
		return {
			isDevVersion: _isDevVersion( state ),
			sitePlan: getSitePlan( state ),
			canDisplayDevCard: canDisplayDevCard( state )
		}
	},
	( dispatch ) => {
		return {
			switchPlanPreview: ( slug ) => {
				return dispatch( switchPlanPreview( slug ) );
			},
			disableDevCard: () => {
				return dispatch( disableDevCard() );
			}
		};
	}
)( DevCard );
