/**
 * External dependencies
 */
import React from 'react';
import ReactDom from 'react-dom';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { isDevVersion as _isDevVersion, userCanManageOptions } from 'state/initial-state';
import { canDisplayDevCard, enableDevCard, resetOptions } from 'state/dev-version';
import DevCard from 'components/dev-card';
import onKeyDownCallback from 'utils/onkeydown-callback';

export class Footer extends React.Component {
	static displayName = 'Footer';

	resetOnClick = () => {
		if ( window.confirm( __( 'This will reset all Jetpack options, are you sure?' ) ) ) {
			this.props.resetOptions();
		}
	};

	render() {
		if ( ! this.props.isDevVersion ) {
			return null;
		}
		const maybeShowReset = () => {
			if ( this.props.userCanManageOptions ) {
				return (
					<li className="jp-footer__link-item" key="reset">
						<a
							role="button"
							tabIndex="0"
							onKeyDown={ onKeyDownCallback( this.resetOnClick ) }
							onClick={ this.resetOnClick }
							className="jp-footer__link"
						>
							{ __( 'Reset Options (dev only)', { context: 'Navigation item.' } ) }
						</a>
					</li>
				);
			}
			return null;
		};

		const maybeShowDevCardFooterLink = () => {
			return (
				<li className="jp-footer__link-item" key="dev-tools">
					<a
						role="button"
						tabIndex="0"
						onKeyDown={ onKeyDownCallback( this.props.enableDevCard ) }
						onClick={ this.props.enableDevCard }
						className="jp-footer__link"
					>
						{ __( 'Dev Tools', { context: 'Navigation item.' } ) }
					</a>
				</li>
			);
		};

		const maybeShowDevCard = () => {
			return this.props.displayDevCard && <DevCard key="dev-card" />;
		};

		const children = [ maybeShowReset(), maybeShowDevCardFooterLink(), maybeShowDevCard() ];
		return ReactDom.createPortal( children, document.getElementById( 'jp-footer__links-id' ) );
	}
}

export default connect(
	state => {
		return {
			displayDevCard: canDisplayDevCard( state ),
			isDevVersion: _isDevVersion( state ),
			userCanManageOptions: userCanManageOptions( state ),
		};
	},
	dispatch => {
		return {
			resetOptions: () => {
				return dispatch( resetOptions( 'options' ) );
			},
			enableDevCard: () => {
				return dispatch( enableDevCard() );
			},
		};
	}
)( Footer );
