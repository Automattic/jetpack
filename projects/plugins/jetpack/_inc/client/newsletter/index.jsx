import { __ } from '@wordpress/i18n';
import QuerySite from 'components/data/query-site';
import React from 'react';
import { connect } from 'react-redux';
import { getModule } from 'state/modules';
import { isModuleFound as isModuleFoundSelector } from 'state/search';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';
import EmailSettings from './email-settings';
import MessagesSetting from './messages-setting';
import Newsletter from './newsletter';
import NewsletterCategories from './newsletter-categories';
import PaidNewsletter from './paid-newsletter';
import SubscriptionsSettings from './subscriptions-settings';
import './style.scss';

/**
 * Newsletter Section.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Newsletter settings component.
 */
function Subscriptions( props ) {
	const { active, isModuleFound, searchTerm, siteRawUrl, blogID } = props;

	const foundSubscriptions = isModuleFound( SUBSCRIPTIONS_MODULE_NAME );

	if ( ! searchTerm && ! active ) {
		return null;
	}

	if ( ! foundSubscriptions ) {
		return null;
	}

	return (
		<div>
			<QuerySite />
			<h1 className="screen-reader-text">{ __( 'Jetpack Newsletter Settings', 'jetpack' ) }</h1>
			<h2 className="jp-settings__section-title">
				{ searchTerm
					? __( 'Newsletter', 'jetpack' )
					: __(
							'Transform your blog posts into newsletters to easily reach your subscribers.',
							'jetpack',
							/* dummy arg to avoid bad minification */ 0
					  ) }
			</h2>
			{ foundSubscriptions && (
				<>
					<Newsletter siteRawUrl={ siteRawUrl } blogID={ blogID } />
					<SubscriptionsSettings />
					<PaidNewsletter />
					<NewsletterCategories />
					<EmailSettings />
					<MessagesSetting { ...props } />
				</>
			) }
		</div>
	);
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isModuleFound: module_name => isModuleFoundSelector( state, module_name ),
	};
} )( Subscriptions );
