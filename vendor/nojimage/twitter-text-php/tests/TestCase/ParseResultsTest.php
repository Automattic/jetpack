<?php

/**
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */

namespace Twitter\Text\TestCase;

use PHPUnit\Framework\TestCase;
use Twitter\Text\ParseResults;

/**
 * Twitter Text ParseResults Unit Tests
 *
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */
class ParseResultsTest extends TestCase
{

    /**
     * @var ParseResults
     */
    private $results;

    /**
     * Set up fixtures
     *
     * @return void
     */
    protected function setUp()
    {
        $this->results = new ParseResults();
    }

    /**
     * Tears down fixtures
     *
     * @return void
     */
    protected function tearDown()
    {
        unset($this->results);
    }

    /**
     * test for new result
     *
     * @return void
     */
    public function testConstruct()
    {
        $result = new ParseResults(192, 685, true, array(0, 210), array(0, 210));

        $this->assertSame(192, $result->weightedLength);
        $this->assertSame(685, $result->permillage);
        $this->assertSame(true, $result->valid);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(210, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(210, $result->validRangeEnd);
    }

    /**
     * test get empty result
     *
     * @return void
     */
    public function testConstructEmpty()
    {
        $result = new ParseResults();

        $this->assertSame(0, $result->weightedLength);
        $this->assertSame(0, $result->permillage);
        $this->assertSame(false, $result->valid);
        $this->assertSame(0, $result->displayRangeStart);
        $this->assertSame(0, $result->displayRangeEnd);
        $this->assertSame(0, $result->validRangeStart);
        $this->assertSame(0, $result->validRangeEnd);
    }

    /**
     * test for array
     */
    public function testToArray()
    {
        $result = new ParseResults(192, 685, true, array(0, 210), array(0, 210));

        $this->assertSame(array(
            'weightedLength' => 192,
            'valid' => true,
            'permillage' => 685,
            'displayRangeStart' => 0,
            'displayRangeEnd' => 210,
            'validRangeStart' => 0,
            'validRangeEnd' => 210,
        ), $result->toArray());
    }

    /**
     * test set variable
     *
     * @dataProvider dataSetVariable
     */
    public function testSetVariable($message, $key, $value, $expected)
    {
        $this->results->$key = $value;

        $this->assertSame($expected, $this->results->$key, $message);
    }

    /**
     * data for testSetVariable
     *
     * @return array
     */
    public function dataSetVariable()
    {
        return array(
            array('weightedLength to be integer', 'weightedLength', '1', 1),
            array('permillage to be integer', 'permillage', '1', 1),
            array('isValid to be boolean', 'valid', '1', true),
            array('displayRangeStart to be integer', 'displayRangeStart', '0', 0),
            array('displayRangeEnd to be integer', 'displayRangeEnd', '0', 0),
            array('validRangeStart to be integer', 'validRangeStart', '0', 0),
            array('validRangeEnd to be integer', 'validRangeEnd', '0', 0),
        );
    }

    /**
     * test set valiable
     *
     * @dataProvider dataSetInvalidRange
     * @expectedException \RangeException
     */
    public function testSetInvalidRange($message, $key, $value)
    {
        $this->results->$key = $value;
    }

    /**
     * data for testSetInvalidRange
     *
     * @return array
     */
    public function dataSetInvalidRange()
    {
        return array(
            array('displayRangeStart less than displayRangeEnd', 'displayRangeStart', 1),
            array('validRangeStart less than validRangeEnd', 'validRangeStart', 1),
        );
    }
}
