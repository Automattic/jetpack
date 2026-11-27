<?php
/**
 * A second handler, so the engine is exercised by more than one type.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposal_Handler;

/**
 * Sets `stub_<key>` options.
 */
class Stub_Option_Handler implements Proposal_Handler {

	const TYPE = 'stub_option';

	/**
	 * Items passed to each start_preview() call.
	 *
	 * @var array<int, array>
	 */
	public $preview_calls = array();

	/**
	 * {@inheritDoc}
	 */
	public function build( array $request ) {
		$key = (string) ( $request['key'] ?? '' );
		if ( ! preg_match( '/^[a-z-]+$/', $key ) ) {
			return new WP_Error( 'stub_invalid', 'Bad key.' );
		}
		return array(
			'target' => array( 'key' => $key ),
			'base'   => array( 'from' => (string) get_option( 'stub_' . $key, '' ) ),
			'change' => array( 'to' => (string) ( $request['value'] ?? '' ) ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public function is_valid( array $item ): bool {
		return array( 'key' ) === array_keys( $item['target'] )
			&& is_string( $item['target']['key'] )
			&& array( 'from' ) === array_keys( $item['base'] )
			&& array( 'to' ) === array_keys( $item['change'] )
			&& is_string( $item['change']['to'] );
	}

	/**
	 * {@inheritDoc}
	 */
	public function targets( array $item ): array {
		return array( 'stub:' . $item['target']['key'] );
	}

	/**
	 * {@inheritDoc}
	 */
	public function can_review( array $item ): bool { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Interface signature.
		return current_user_can( 'manage_options' );
	}

	/**
	 * {@inheritDoc}
	 */
	public function conflicts( array $item ): array {
		return (string) get_option( 'stub_' . $item['target']['key'], '' ) === $item['base']['from']
			? array()
			: array( array( 'reason' => 'The option changed.' ) );
	}

	/**
	 * {@inheritDoc}
	 */
	public function start_preview( array $items ): void {
		$this->preview_calls[] = $items;
	}

	/**
	 * {@inheritDoc}
	 */
	public function preview_target( array $item ): ?string { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Interface signature.
		return null;
	}

	/**
	 * {@inheritDoc}
	 */
	public function apply( array $item ): array {
		$key = $item['target']['key'];
		if ( get_option( 'stub_fail_' . $key ) ) {
			return array(
				'changed' => array(),
				'error'   => 'Refused.',
			);
		}
		update_option( 'stub_' . $key, $item['change']['to'] );
		return array( 'changed' => array( $key ) );
	}

	/**
	 * {@inheritDoc}
	 */
	public function describe( array $item, string $status ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Interface signature.
		return array(
			array(
				'label' => $item['target']['key'],
				'kind'  => 'text',
				'from'  => $item['base']['from'],
				'to'    => $item['change']['to'],
			),
		);
	}
}
