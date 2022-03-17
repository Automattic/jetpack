<?php
/** @var $waf \Automattic\Jetpack\Waf\WafRuntime */
$rule = (object) array( 'id' => 1337, 'reason' => '', 'tags' => array (
	0 => 'stuff',
) );
if($waf->match_targets(array (
),array (
	'query_string' =>
		array (
		),
),'rx','#.*jetpack-waf-always-block.*#',false,true)) {
	$rule->reason = 'Intentionally blocking this test-request';
	return $waf->block('block',$rule->id,$rule->reason,403);
}
