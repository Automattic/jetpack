import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';
import Notice from '../notice';

export type ValidationNoticeProps = {
	connectionsCount: number;
	invalidConnectionIdsCount: number;
	shouldAutoConvert: boolean;
};

export const ValidationNotice: React.FC< ValidationNoticeProps > = ( {
	connectionsCount,
	invalidConnectionIdsCount,
	shouldAutoConvert,
} ) => {
	return shouldAutoConvert ? null : (
		<Notice type={ 'warning' }>
			<p>
				{ connectionsCount === invalidConnectionIdsCount
					? _n(
							'The selected media cannot be shared to this platform.',
							'The selected media cannot be shared to any of these platforms.',
							connectionsCount,
							'jetpack'
					  )
					: _n(
							'The selected media cannot be shared to one of these platforms.',
							'The selected media cannot be shared to some of these platforms.',
							invalidConnectionIdsCount,
							'jetpack'
					  ) }
			</p>
			<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
				{ __( 'Troubleshooting tips', 'jetpack' ) }
			</ExternalLink>
		</Notice>
	);
};
