import { numberFormat } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, commentContent, post, page, image, video, audio } from '@wordpress/icons';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import ProductCard from '../../connected-product-card';
import styles from './style.module.scss';

const getIcon = slug => {
	switch ( slug ) {
		case 'comment':
			return <Icon icon={ commentContent } size={ 24 } />;
		case 'post':
			return <Icon icon={ post } size={ 24 } />;
		case 'page':
			return <Icon icon={ page } size={ 24 } />;
		case 'image':
			return <Icon icon={ image } size={ 24 } />;
		case 'video':
			return <Icon icon={ video } size={ 24 } />;
		case 'audio':
			return <Icon icon={ audio } size={ 24 } />;
		default:
			return null;
	}
};

const NoBackupsValueSection = ( { siteData } ) => {
	const [ itemsToShow, setItemsToShow ] = useState( 3 );
	const sortedData = [];

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

	// Make sure the data with the highest numbers show first
	Object.keys( siteData ).forEach( key => {
		// We can safely filter out any values that are 0
		if ( siteData[ key ] === 0 ) {
			return;
		}

		sortedData.push( [ key, siteData[ key ] ] );
	} );

	sortedData.sort( ( a, b ) => {
		return a[ 1 ] < b[ 1 ] ? 1 : -1;
	} );

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

// eslint-disable-next-line no-unused-vars
const BackupCard = ( { admin, productData, fetchingProductData } ) => {
	const { has_backup: hasBackups = false, site_data: siteData = {} } = productData || {};

	return (
		<ProductCard admin={ admin } slug="backup" showMenu isDataLoading={ fetchingProductData }>
			{ /* todo: Add component for when users do have backups and an activity log */ }
			{ hasBackups ? <></> : <NoBackupsValueSection siteData={ siteData } /> }
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
