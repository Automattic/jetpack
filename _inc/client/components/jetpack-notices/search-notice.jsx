/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import SimpleNotice from 'components/notice';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	getJetpackNotices as _getJetpackNotices,
	isNoticeDismissed as _isNoticeDismissed,
} from 'state/jetpack-notices';
import { imagePath } from 'constants/urls';
import Button from 'components/button';

export class SearchNotice extends React.Component {
	static displayName = 'SearchActive';

	render() {
		return (
			<SimpleNotice
				showDismiss={ true }
				icon="none"
				isCompact={ false }
				className="jetpack-search-notice__wrapper"
			>
				<img
					src={ imagePath + 'jetpack-search.svg' }
					alt={ __( 'Welcome to Jetpack Search' ) }
					className="jetpack-search-notice__img"
				/>
				<div className="jetpack-search-notice__title">{ __( 'Thank you for your purchase!' ) }</div>
				<p className="jetpack-search-notice__description">
					{ __( 'We are currently indexing your site and will notify you when it is complete.' ) }
				</p>
				<p className="jetpack-search-notice__description">
					{ __(
						'In the meantime, we have added some common filtering widgets to your site that you should try customizing.'
					) }
				</p>
				<Button primary compact={ true } href="customize.php?autofocus[section]=jetpack_search">
					{ __( 'Customize Search Now' ) }
				</Button>
				<Button
					primary={ false }
					compact={ true }
					href="customize.php?autofocus[section]=jetpack_search"
				>
					{ __( "I'll do it later" ) }
				</Button>
			</SimpleNotice>
		);
	}
}

export default connect( state => {
	return {
		jetpackNotices: () => _getJetpackNotices( state ),
		isDismissed: notice => _isNoticeDismissed( state, notice ),
	};
} )( SearchNotice );
