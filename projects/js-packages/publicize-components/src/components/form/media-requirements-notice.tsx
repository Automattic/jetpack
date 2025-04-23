import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { Fragment, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getErrorLabel } from '../../hooks/use-media-restrictions/constants';
import { ValidationErrors } from '../../hooks/use-media-restrictions/types';
import { store as socialStore } from '../../social-store';
import Notice from '../notice';
import { useServiceLabel } from '../services/use-service-label';

export type MediaRequirementsNoticeProps = {
	validationErrors: ValidationErrors;
};

export const MediaRequirementsNotice: React.FC< MediaRequirementsNoticeProps > = ( {
	validationErrors,
} ) => {
	const { getConnectionById } = useSelect( select => select( socialStore ), [] );

	const getServiceLabel = useServiceLabel();

	const errorTypesToServicesMap = useMemo( () => {
		return Object.entries( validationErrors ).reduce< Record< string, Array< string > > >(
			( map, [ connectionId, errorType ] ) => {
				if ( ! errorType ) {
					return map;
				}

				if ( ! map[ errorType ] ) {
					map[ errorType ] = [];
				}

				const label = getServiceLabel( getConnectionById( connectionId )?.service_name );

				if ( label && ! map[ errorType ].includes( label ) ) {
					map[ errorType ].push( label );
				}

				return map;
			},
			{}
		);
	}, [ getConnectionById, getServiceLabel, validationErrors ] );

	return (
		<Notice type={ 'warning' }>
			<p>
				{ __(
					'The selected media cannot be shared to some social media platforms.',
					'jetpack-publicize-components'
				) }
			</p>
			<ul>
				{ /* Let us be a little more helpful and help them by listing the services that need attention */ }
				{ Object.entries( errorTypesToServicesMap ).map( ( [ errorType, services ] ) => {
					if ( ! services.length ) {
						return null;
					}

					return (
						<li key={ errorType }>
							<i>{ getErrorLabel( errorType ) }</i>
							{ _x(
								':',
								'Colon to display before the list of social media platforms',
								'jetpack-publicize-components'
							) + ' ' }
							{
								// Since Intl.ListFormat is not allowed in Jetpack yet,
								// we join the strings with a comma and space
								services.map( ( label, i, { length } ) => (
									<Fragment key={ label }>
										<b>{ label }</b>
										{ i < length - 1 &&
											_x(
												',',
												'Comma to separate list of social media platforms',
												'jetpack-publicize-components'
											) + ' ' }
									</Fragment>
								) )
							}
						</li>
					);
				} ) }
			</ul>
			<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
				{ __( 'Troubleshooting tips', 'jetpack-publicize-components' ) }
			</ExternalLink>
		</Notice>
	);
};
