import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import './style.scss';
import AssistantWizard from './assistant-wizard';

const debug = debugFactory( 'jetpack-ai:seo-assistant-wizard' );

export default function SeoAssistantWizard( { close }: { close?: () => void } ) {
	debug( 'render' );
	return (
		<AssistantWizard
			close={ close }
			tasks={ [
				{
					id: 'welcome',
					title: __( 'Optimise for SEO', 'jetpack' ),
					label: 'welcome',
					type: 'welcome',
					autoAdvance: 1500,
					messages: [
						{
							content: createInterpolateElement(
								__( "<b>Hi there! 👋 Let's optimise your blog post for SEO.</b>", 'jetpack' ),
								{ b: <b /> }
							),
							showIcon: true,
							id: '1',
						},
						{
							content: createInterpolateElement(
								__(
									"Here's what we can improve:<br />1. Keywords<br />2. Title<br />3. Meta description",
									'jetpack'
								),
								{ br: <br /> }
							),
							showIcon: false,
							id: '2',
						},
					],
				},
			] }
		/>
	);
}
