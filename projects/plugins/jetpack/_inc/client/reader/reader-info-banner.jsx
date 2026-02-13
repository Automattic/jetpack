import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { connect } from 'react-redux';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { getModule } from 'state/modules';
import './reader-info-banner.scss';

const trackReaderClick = () => {
	analytics.tracks.recordJetpackClick( 'open-reader' );
};

/**
 * ReaderInfoBanner component.
 *
 * @param {object} props - Component props.
 * @return {import('react').ReactElement} ReaderInfoBanner component.
 */
function ReaderInfoBanner( props ) {
	const { readerModule, moduleName, blogID } = props;

	const readerUrl = addQueryArgs(
		'https://wordpress.com/reader/',
		blogID ? { origin_site_id: blogID } : {}
	);

	return (
		<SettingsCard
			{ ...props }
			header={ __(
				'Connect with millions of creators and readers across the WordPress.com and Jetpack network.',
				'jetpack'
			) }
			hideButton
			module={ moduleName }
		>
			<SettingsGroup module={ readerModule }>
				<ul role="list" className="jp-reader-discover__list">
					<li>{ __( 'Follow sites you love and explore content by topic', 'jetpack' ) }</li>
					<li>{ __( 'Reach new readers through Reader feeds and tag pages', 'jetpack' ) }</li>
					<li>{ __( 'Recommend creators you enjoy and get recommended back', 'jetpack' ) }</li>
				</ul>
			</SettingsGroup>
			<Card
				compact
				className="jp-settings-card__configure-link"
				onClick={ trackReaderClick }
				href={ readerUrl }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Visit the Reader', 'jetpack' ) }
			</Card>
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			readerModule: getModule( state, ownProps.moduleName ),
		};
	} )( ReaderInfoBanner )
);
