<?php
return array(
	'domain' => 'target',
	'type' => 'plugins',
	'packages' => array(
		'foo' => array(
			'path' => 'path/to/foo',
			'ver' => '1.2.3',
		),
		'bar' => '4.5.6',
	),
	'paths' => array(
		'target' => array(
			'path' => 'path/to/target',
			'ver' => '7.8.9',
		),
	),
);
