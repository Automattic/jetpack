<?php

namespace Twitter\Text\TestCase;

use PHPUnit\Framework\TestCase;
use Twitter\Text\TldLists;

/**
 * Test for TldLists
 */
class TldListsTest extends TestCase
{

    /**
     * @covers \Twitter\Text\TldLists::getValidGTLD
     */
    public function testGetValidGTLD()
    {
        $regexp = TldLists::getValidGTLD();
        $this->assertStringStartsWith('(?:(?:삼성|닷컴|', $regexp);
        $this->assertStringEndsWith('|aaa|onion)(?=[^0-9a-z@+-]|$))', $regexp);

        $regexpCached = TldLists::getValidGTLD();
        $this->assertSame($regexp, $regexpCached);
    }

    /**
     * @covers \Twitter\Text\TldLists::getValidCcTLD
     */
    public function testGetValidCcTLD()
    {
        $regexp = TldLists::getValidCcTLD();
        $this->assertStringStartsWith('(?:(?:한국|香港|', $regexp);
        $this->assertStringEndsWith('|ad|ac)(?=[^0-9a-z@+-]|$))', $regexp);

        $regexpCached = TldLists::getValidCcTLD();
        $this->assertSame($regexp, $regexpCached);
    }
}
