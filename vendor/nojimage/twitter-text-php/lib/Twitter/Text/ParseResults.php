<?php

/**
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */

namespace Twitter\Text;

/**
 * Twitter Text ParseResults
 *
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 *
 * @property int $weightedLength The overall length of the tweet with code points weighted per the ranges defined
 *                               in the configuration file.
 * @property int $permillage     Indicates the proportion (per thousand) of the weighted length in comparison to
 *                               the max weighted length. A value > 1000 indicates input text that is longer than
 *                               the allowable maximum.
 * @property bool $valid         Indicates if input text length corresponds to a valid result.
 * @property int $displayRangeStart
 * @property int $displayRangeEnd
 * @property int $validRangeStart
 * @property int $validRangeEnd
 */
class ParseResults
{

    /**
     * A pair of unicode code point indices identifying the inclusive start and exclusive end of
     * the displayable content of the Tweet.
     *
     * @var array
     * @link https://developer.twitter.com/en/docs/tweets/tweet-updates
     */
    protected $displayTextRange = array(0, 0);

    /**
     * A pair of unicode code point indices identifying the inclusive start and exclusive end of
     * the valid content of the Tweet.
     *
     * @var array
     * @link https://developer.twitter.com/en/docs/tweets/tweet-updates
     */
    protected $validTextRange = array(0, 0);

    /**
     * @var array
     */
    protected $result = array(
        'weightedLength' => 0,
        'valid' => false,
        'permillage' => 0,
    );

    /**
     * Tweet parsed results
     *
     * @param int $weightedLength
     * @param int $permillage
     * @param bool $isValid
     * @param array $displayTextRange
     * @param array $validTextRange
     */
    public function __construct(
        $weightedLength = 0,
        $permillage = 0,
        $isValid = false,
        array $displayTextRange = array(0, 0),
        array $validTextRange = array(0, 0)
    ) {
        $this->weightedLength = $weightedLength;
        $this->permillage = $permillage;
        $this->valid = $isValid;
        $this->displayRangeEnd = $displayTextRange[1];
        $this->displayRangeStart = $displayTextRange[0];
        $this->validRangeEnd = $validTextRange[1];
        $this->validRangeStart = $validTextRange[0];
    }

    /**
     * property accessor
     *
     * @param string $name
     * @return mixed
     */
    public function __get($name)
    {
        if ($name === 'displayRangeStart') {
            return $this->displayTextRange[0];
        }

        if ($name === 'displayRangeEnd') {
            return $this->displayTextRange[1];
        }

        if ($name === 'validRangeStart') {
            return $this->validTextRange[0];
        }

        if ($name === 'validRangeEnd') {
            return $this->validTextRange[1];
        }

        return isset($this->result[$name]) ? $this->result[$name] : null;
    }

    /**
     * property setter
     *
     * @param string $name
     * @param mixed $value
     * @return void
     */
    public function __set($name, $value)
    {
        if (
            $name === 'displayRangeStart'
            && $this->lte($value, $this->displayTextRange[1], $name, 'displayRangeEnd')
        ) {
            $this->displayTextRange[0] = (int)$value;
        } elseif (
            $name === 'displayRangeEnd'
            && $this->gte($value, $this->displayTextRange[0], $name, 'displayRangeStart')
        ) {
            $this->displayTextRange[1] = (int)$value;
        } elseif (
            $name === 'validRangeStart'
            && $this->lte($value, $this->validTextRange[1], $name, 'validRangeEnd')
        ) {
            $this->validTextRange[0] = (int)$value;
        } elseif (
            $name === 'validRangeEnd'
            && $this->gte($value, $this->validTextRange[0], $name, 'validRangeStart')
        ) {
            $this->validTextRange[1] = (int)$value;
        } elseif ($name === 'valid') {
            $this->result[$name] = (bool)$value;
        } elseif (isset($this->result[$name])) {
            $this->result[$name] = (int)$value;
        }
    }

    /**
     * check value less than equals
     *
     * @param int $lessValue
     * @param int $greaterValue
     * @param string $lessValueLabel
     * @param string $greaterValueLabel
     * @return bool
     * @throws \RangeException
     */
    private function lte($lessValue, $greaterValue, $lessValueLabel, $greaterValueLabel)
    {
        if ($lessValue > $greaterValue) {
            throw new \RangeException("$lessValueLabel should be less than equals $greaterValueLabel: "
                . "[$lessValue, $greaterValue]");
        }

        return true;
    }

    /**
     * check value less than equals
     *
     * @param int $greaterValue
     * @param int $lessValue
     * @param string $greaterValueLabel
     * @param string $lessValueLabel
     * @return bool
     * @throws \RangeException
     */
    private function gte($greaterValue, $lessValue, $greaterValueLabel, $lessValueLabel)
    {
        if ($lessValue > $greaterValue) {
            throw new \RangeException("$greaterValueLabel should be greater than equals $lessValueLabel: "
                . "[$lessValue, $greaterValue]");
        }

        return true;
    }

    /**
     * convert to array
     *
     * @return array
     */
    public function toArray()
    {
        return array_merge($this->result, array(
            'displayRangeStart' => $this->displayRangeStart,
            'displayRangeEnd' => $this->displayRangeEnd,
            'validRangeStart' => $this->validRangeStart,
            'validRangeEnd' => $this->validRangeEnd,
        ));
    }
}
