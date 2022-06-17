import { Container, Col, H3, Text } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, edit, lifesaver } from '@wordpress/icons';
import classnames from 'classnames';
import { STORE_ID } from '../../store';
import ShareCounter from '../share-counter';
import StatCards from '../stat-cards';
import Upsell from '../upsell';
import illustration from './illustration.svg';
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

const SideColumn = ( { hasConnections, hasPaidUpgrade } ) => {
	if ( ! hasConnections ) {
		return <img src={ illustration } alt="" />;
	}

	if ( hasPaidUpgrade ) {
		return <StatCards />;
	}

	return (
		<div className={ styles.column }>
			<ShareCounter value={ 18 } max={ 30 } />
			<Upsell />
		</div>
	);
};

const Header = () => {
	const { hasConnections, hasPaidUpgrade } = useSelect( select => {
		const store = select( STORE_ID );
		return {
			hasConnections: store.hasConnections(),
			hasPaidUpgrade: store.hasPaidUpgrade(),
		};
	} );

	const columnClassname = classnames( {
		[ styles.illustration ]: ! hasConnections,
	} );

	const text = createInterpolateElement(
		__(
			'Share your WordPress posts up to 30 times in your social media for free each month. <link>Learn more</link>',
			'jetpack-social'
		),
		{
			// TODO: Add proper link (with Jetpack Redirect)
			link: <a href="" />,
		}
	);

	// TODO: Add real links
	const actions = [
		{
			link: '',
			label: __( 'Write a post', 'jetpack-social' ),
			icon: edit,
		},
	];

	if ( hasPaidUpgrade ) {
		actions.push( { link: '', label: __( 'Need help?', 'jetpack-social' ), icon: lifesaver } );
	}

	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 7 } className={ styles.container }>
			<Col sm={ 4 } md={ 4 } lg={ 5 }>
				<H3 mt={ 2 }>
					{ hasPaidUpgrade
						? __( 'Post everywhere at any time', 'jetpack-social' )
						: __( 'Post everywhere', 'jetpack-social' ) }
				</H3>
				{ ! hasPaidUpgrade && <Text className={ styles.title }>{ text }</Text> }
				<Actions actions={ actions } />
			</Col>
			<Col
				sm={ 4 }
				md={ 4 }
				lg={ { start: hasPaidUpgrade ? 7 : 6, end: 12 } }
				className={ columnClassname }
			>
				<SideColumn hasConnections={ hasConnections } hasPaidUpgrade={ hasPaidUpgrade } />
			</Col>
		</Container>
	);
};

export default Header;
