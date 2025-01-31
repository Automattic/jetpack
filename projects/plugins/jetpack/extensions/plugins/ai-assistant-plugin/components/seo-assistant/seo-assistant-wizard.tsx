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
					autoAdvance: 1,
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
				{
					id: 'completion',
					title: __( 'Your post is SEO-ready', 'jetpack' ),
					label: 'completion',
					type: 'completion',
					submitCtaLabel: __( 'Done!', 'jetpack' ),
					onSubmit: () => close(),
					messages: [
						{
							content: __( "Here's your updated checklist:", 'jetpack' ),
							showIcon: true,
							id: '1',
						},
						{
							content: 'some summary here!',
							showIcon: false,
							id: '2',
						},
						{
							content: createInterpolateElement(
								__(
									'SEO optimization complete! 🎉<br/>Your blog post is now search-engine friendly.',
									'jetpack'
								),
								{ br: <br /> }
							),
							showIcon: true,
							id: '3',
						},
						{
							content: __( 'Happy blogging! 😊', 'jetpack' ),
							showIcon: false,
							id: '4',
						},
					],
				},
			] }
		/>
	);
}
