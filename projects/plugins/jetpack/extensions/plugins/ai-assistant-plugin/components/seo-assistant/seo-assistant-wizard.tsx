import debugFactory from 'debug';
import './style.scss';
import AssistantWizard from './assistant-wizard';

const debug = debugFactory( 'jetpack-ai:seo-assistant-wizard' );

export default function SeoAssistantWizard( { close }: { close?: () => void } ) {
	debug( 'render' );
	return <AssistantWizard close={ close } />;
}
