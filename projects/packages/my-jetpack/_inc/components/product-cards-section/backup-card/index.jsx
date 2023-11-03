import { numberFormat, Text, getRedirectUrl } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import Gridicon from 'gridicons';
import PropTypes from 'prop-types';
import { useEffect, useState, useMemo } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import { useProduct } from '../../../hooks/use-product';
import ProductCard from '../../connected-product-card';
import { PRODUCT_STATUSES } from '../../product-card/action-button';
import styles from './style.module.scss';

const getIcon = slug => {
	switch ( slug ) {
		case 'post':
			return <Gridicon icon="posts" size={ 24 } />;
		case 'page':
			return <Gridicon icon="pages" size={ 24 } />;
		default:
			return <Gridicon icon={ slug } size={ 24 } />;
	}
};

const getTitle = slug => {
	switch ( slug ) {
		case 'comment':
			return 'Comments';
		case 'post':
			return 'Posts';
		case 'page':
			return 'Pages';
		case 'image':
			return 'Images';
		case 'video':
			return 'Videos';
		case 'audio':
			return 'Audio Files';
		default:
			return slug;
	}
};

const NoBackupsValueSection = ( { siteData } ) => {
	const [ itemsToShow, setItemsToShow ] = useState( 3 );

	const sortedData = useMemo( () => {
		const data = [];

		Object.keys( siteData ).forEach( key => {
			// We can safely filter out any values that are 0
			if ( siteData[ key ] === 0 ) {
				return;
			}

			data.push( [ key, siteData[ key ] ] );
		} );

		data.sort( ( a, b ) => {
			return a[ 1 ] < b[ 1 ] ? 1 : -1;
		} );

		return data;
	}, [ siteData ] );

	// Only show 2 data points on certain screen widths where the cards are squished
	useEffect( () => {
		window.onresize = () => {
			if ( ( window.innerWidth >= 961 && window.innerWidth <= 1070 ) || window.innerWidth < 290 ) {
				setItemsToShow( 2 );
			} else {
				setItemsToShow( 3 );
			}
		};

		return () => {
			window.onresize = null;
		};
	}, [] );

	const moreValue = sortedData.length > itemsToShow ? sortedData.length - itemsToShow : 0;
	const shortenedNumberConfig = { maximumFractionDigits: 1, notation: 'compact' };

	return (
		<div className={ styles[ 'no-backup-stats' ] }>
			<div className={ styles[ 'main-stats' ] }>
				{ sortedData.slice( 0, itemsToShow ).map( ( item, i ) => {
					const slug = item[ 0 ].split( '_' )[ 1 ];
					const value = item[ 1 ];

					return (
						<div
							className={ classNames( styles[ 'main-stat' ], `main-stat-${ i }` ) }
							key={ i + slug }
							title={ getTitle( slug ) }
						>
							{ getIcon( slug ) }
							<span>{ numberFormat( value, shortenedNumberConfig ) }</span>
						</div>
					);
				} ) }
			</div>

			{ moreValue > 0 && (
				<p className={ styles[ 'more-stats' ] }>
					{
						// translators: %s is the number of items that are not shown
						sprintf( __( '+%s more', 'jetpack-my-jetpack' ), moreValue )
					}
				</p>
			) }
		</div>
	);
};

const WithBackupsValueSection = ( { lastUndoableEvent } ) => {
	if ( ! lastUndoableEvent || ! lastUndoableEvent.data ) {
		return null;
	}
	const { last_rewindable_event: lastRewindableEvent = {} } = lastUndoableEvent.data;

	return (
		<div className={ styles.activity }>
			<Gridicon icon={ lastRewindableEvent.gridicon } size={ 24 } />
			<p className={ styles.summary }>{ lastRewindableEvent.summary }</p>
		</div>
	);
};

const getTimeSinceLastRenewableEvent = lastRewindableEventTime => {
	if ( ! lastRewindableEventTime ) {
		return '';
	}

	const now = new Date();
	const lastRewindableEventDate = new Date( lastRewindableEventTime );
	const timeSinceLastRenewableEvent = now - lastRewindableEventDate;

	if ( timeSinceLastRenewableEvent > 0 ) {
		const days = Math.floor( timeSinceLastRenewableEvent / ( 1000 * 60 * 60 * 24 ) );
		const hours = Math.floor(
			( timeSinceLastRenewableEvent % ( 1000 * 60 * 60 * 24 ) ) / ( 1000 * 60 * 60 )
		);
		const minutes = Math.floor(
			( timeSinceLastRenewableEvent % ( 1000 * 60 * 60 ) ) / ( 1000 * 60 )
		);
		const seconds = Math.floor( ( timeSinceLastRenewableEvent % ( 1000 * 60 ) ) / 1000 );

		if ( days > 0 ) {
			return sprintf(
				// translators: %s is the number of days since the last backup
				_n( '%s day ago', '%s days ago', days, 'jetpack-my-jetpack' ),
				days
			);
		}

		if ( hours > 0 ) {
			return sprintf(
				// translators: %s is the number of hours since the last backup
				_n( '%s hour ago', '%s hours ago', hours, 'jetpack-my-jetpack' ),
				hours
			);
		}

		if ( minutes > 0 ) {
			return sprintf(
				// translators: %s is the number of minutes since the last backup
				_n( '%s minute ago', '%s minutes ago', minutes, 'jetpack-my-jetpack' ),
				minutes
			);
		}

		return sprintf(
			// translators: %s is the number of seconds since the last backup
			_n( '%s second ago', '%s seconds ago', seconds, 'jetpack-my-jetpack' ),
			seconds
		);
	}
};

const BackupCard = ( { admin, productData, fetchingProductData } ) => {
	const slug = 'backup';

	const { recordEvent } = useAnalytics();
	const { detail } = useProduct( slug );
	const { status } = detail;
	const hasBackups = status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	const { site_data: siteData = {}, last_undoable_event: lastUndoableEvent = {} } =
		productData || {};

	const lastRewindableEventTime = lastUndoableEvent?.data?.last_rewindable_event?.published;
	const hasRewindableEvent = hasBackups && lastUndoableEvent?.data;
	const undoBackupId = lastUndoableEvent?.data?.undo_backup_id;

	const handleUndoClick = () => {
		recordEvent( 'jetpack_myjetpack_backup_card_undo_click', {
			product: slug,
			undo_backup_id: undoBackupId,
		} );
	};

	const undoAction = {
		href: getRedirectUrl( 'jetpack-backup-undo-cta', {
			path: undoBackupId,
			site: window?.myJetpackInitialState?.siteSuffix,
		} ),
		size: 'small',
		variant: 'primary',
		weight: 'regular',
		label: __( 'Undo', 'jetpack-my-jetpack' ),
		onClick: handleUndoClick,
		isExternalLink: true,
	};

	const WithBackupsDescription = () => (
		<Text variant="body-small" className={ styles.description }>
			<span>{ __( 'Activity Detected', 'jetpack-my-jetpack' ) }</span>
			<span className={ styles.time }>
				{ getTimeSinceLastRenewableEvent( lastRewindableEventTime ) }
			</span>
		</Text>
	);

	return (
		<ProductCard
			admin={ admin }
			slug={ slug }
			showMenu
			isDataLoading={ fetchingProductData }
			Description={ hasRewindableEvent ? WithBackupsDescription : null }
			additionalActions={ hasRewindableEvent ? [ undoAction ] : null }
		>
			{ hasBackups ? (
				<WithBackupsValueSection lastUndoableEvent={ lastUndoableEvent } />
			) : (
				<NoBackupsValueSection siteData={ siteData } />
			) }
		</ProductCard>
	);
};

BackupCard.propTypes = {
	admin: PropTypes.bool.isRequired,
	productData: PropTypes.object,
	fetchingProductData: PropTypes.bool.isRequired,
};

NoBackupsValueSection.propTypes = {
	productData: PropTypes.object,
};

export default BackupCard;
