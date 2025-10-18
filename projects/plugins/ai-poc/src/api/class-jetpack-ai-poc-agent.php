<?php
/**
 * Jetpack AI POC Agent using Neuron AI Framework.
 *
 * @package automattic/jetpack-ai-poc
 */

use NeuronAI\Agent;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\Anthropic\Anthropic;
use NeuronAI\SystemPrompt;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_AI_POC_Agent
 *
 * Extends Neuron AI Agent with WordPress Abilities as tools.
 */
class Jetpack_AI_POC_Agent extends Agent {

	/**
	 * Anthropic API key.
	 *
	 * @var string
	 */
	private $api_key;

	/**
	 * Anthropic model.
	 *
	 * @var string
	 */
	private $model_name;

	/**
	 * Set API key and model.
	 *
	 * @param string $api_key Anthropic API key.
	 * @param string $model Model to use.
	 * @return self
	 */
	public function with_credentials( $api_key, $model = 'claude-3-5-sonnet-20241022' ) {
		$this->api_key    = $api_key;
		$this->model_name = $model;
		return $this;
	}

	/**
	 * Define the AI provider (Anthropic Claude).
	 *
	 * @return AIProviderInterface
	 */
	protected function provider(): AIProviderInterface {
		$api_key = $this->api_key ? $this->api_key : get_option( 'jetpack_ai_poc_anthropic_key' );
		$model   = $this->model_name ? $this->model_name : 'claude-3-5-sonnet-20241022';

		return new Anthropic( $api_key, $model );
	}

	/**
	 * Define the agent's system instructions.
	 *
	 * @return string
	 */
	public function instructions(): string {
		$background = array(
			'You are a helpful WordPress assistant powered by Jetpack.',
			'You have access to WordPress abilities that allow you to perform various tasks.',
			'You can enable or disable security features, and perform other WordPress-related actions.',
		);

		$capabilities = array(
			'Manage Jetpack security modules (Account Protection and Monitor)',
			'Provide information about WordPress site configuration',
			'Help users understand and configure their WordPress site',
		);

		return (string) new SystemPrompt( $background, $capabilities );
	}

	/**
	 * Define the tools (WordPress Abilities) available to the agent.
	 *
	 * @return array
	 */
	protected function tools(): array {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			return array();
		}

		$abilities = wp_get_abilities();
		$tools     = array();

		foreach ( $abilities as $ability ) {
			$tools[] = new Jetpack_AI_POC_Ability_Tool( $ability );
		}

		return $tools;
	}
}
