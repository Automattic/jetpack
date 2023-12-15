import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { usePublicizeConfig } from '../../..';
import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions, { NO_MEDIA_ERROR } from '../../hooks/use-media-restrictions';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store as socialStore } from '../../social-store';
import PublicizeConnection from '../connection';
import PublicizeSettingsButton from '../settings-button';
import styles from './styles.module.scss';

export const ConnectionsList: React.FC = () => {
	const { connections, toggleById, enabledConnections } = useSocialMediaConnections();
	const { isPublicizeEnabled, isPublicizeDisabledBySitePlan } = usePublicizeConfig();
	const { isEnabled: isSocialImageGeneratorEnabledForPost } = useImageGeneratorConfig();
	const { showShareLimits, numberOfSharesRemaining } = useSelect( select => {
		return {
			showShareLimits: select( socialStore ).showShareLimits(),
			numberOfSharesRemaining: select( socialStore ).numberOfSharesRemaining(),
		};
	}, [] );

	const outOfConnections = showShareLimits && numberOfSharesRemaining <= enabledConnections.length;

	const isAutoConversionEnabled = useSelect(
		select => select( socialStore ).isAutoConversionEnabled(),
		[]
	);

	const { attachedMedia, shouldUploadAttachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();
	const mediaId = attachedMedia[ 0 ]?.id || featuredImageId;

	const { validationErrors, isConvertible } = useMediaRestrictions(
		connections,
		useMediaDetails( mediaId )[ 0 ],
		{
			isSocialImageGeneratorEnabledForPost,
			shouldUploadAttachedMedia,
		}
	);
	const shouldAutoConvert = isAutoConversionEnabled && isConvertible;

	const isConnectionEnabled = useCallback(
		( { enabled, is_healthy = true, connection_id } ) =>
			enabled &&
			! isPublicizeDisabledBySitePlan &&
			false !== is_healthy &&
			( ! validationErrors[ connection_id ] || shouldAutoConvert ) &&
			validationErrors[ connection_id ] !== NO_MEDIA_ERROR,
		[ isPublicizeDisabledBySitePlan, validationErrors, shouldAutoConvert ]
	);

	return (
		<ul className={ styles[ 'connections-list' ] }>
			{ connections.map( conn => {
				const {
					display_name,
					enabled,
					id,
					service_name,
					toggleable,
					profile_picture,
					is_healthy,
					connection_id,
				} = conn;
				const currentId = connection_id ? connection_id : id;
				return (
					<PublicizeConnection
						disabled={
							! isPublicizeEnabled ||
							( ! enabled && toggleable && outOfConnections ) ||
							false === is_healthy ||
							( validationErrors[ currentId ] !== undefined && ! shouldAutoConvert ) ||
							validationErrors[ currentId ] === NO_MEDIA_ERROR
						}
						enabled={ isConnectionEnabled( conn ) }
						key={ currentId }
						id={ currentId }
						label={ display_name }
						name={ service_name }
						toggleConnection={ toggleById }
						profilePicture={ profile_picture }
					/>
				);
			} ) }
			<li>
				<PublicizeSettingsButton />
			</li>
		</ul>
	);
};
