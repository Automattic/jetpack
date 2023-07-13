<?php
namespace Automattic\Jetpack_Inspect\Monitor;

interface Observable {
	public function attach_hooks();
	public function detach_hooks();
	public function get();
}
