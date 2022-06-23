import { Container, Col, H3, Text, Spinner, SocialIcon } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, edit, lifesaver } from '@wordpress/icons';
import { STORE_ID } from '../../store';
import styles from './styles.module.scss';

const Actions = ( { actions } ) => (
	<div className={ styles.actions }>
		{ actions.map( ( { link, label, icon } ) => (
			<Text key={ label }>
				<a href={ link } className={ styles.action }>
					{ icon && <Icon icon={ icon } size={ 16 } /> }
					{ label }
				</a>
			</Text>
		) ) }
	</div>
);
const Header = () => {
	useDispatch( STORE_ID ).getSharesCount();
	const { sharesCountResponse } = useSelect( select => {
		const store = select( STORE_ID );
		return {
			sharesCountResponse: store.getSharesCount(),
		};
	} );
	const sharesCountLoaded = sharesCountResponse && sharesCountResponse.results;
	const sharesCount = sharesCountLoaded ? sharesCountResponse.results.total : 0;
	const actions = [
		{
			link: '/wp-admin/post-new.php',
			label: __( 'Write a post', 'jetpack-social' ),
			icon: edit,
		},
		{
			link: '/wp-admin/post-new.php',
			label: __( 'Need help?', 'jetpack-social' ),
			icon: lifesaver,
		},
	];
	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 7 } className={ styles.container }>
			<Col sm={ 4 } md={ 4 } lg={ 5 }>
				<H3 mt={ 2 }>{ __( 'Post everywhere at any time', 'jetpack-social' ) }</H3>
				<Actions actions={ actions } />
			</Col>
			<div className={ styles.sharesCard }>
				<div className={ styles.socialIcon }>
					<SocialIcon />
				</div>
				<div className={ styles.sharesCardHeading }>Total shares this month</div>
				<div className={ styles.sharesCount }>
					{ sharesCountLoaded ? sharesCount : <Spinner color="#000" size={ 24 } /> }
				</div>
			</div>
		</Container>
	);
};

export default Header;
