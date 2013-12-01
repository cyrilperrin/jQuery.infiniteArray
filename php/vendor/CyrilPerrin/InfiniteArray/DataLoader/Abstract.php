<?php

namespace CyrilPerrin\InfiniteArray;

/**
 * Abstract data loader
 */
abstract class DataLoader_Abstract implements DataLoader_Interface
{
    /** @var int $_rangeStart range start */
    protected $_rangeStart = null;

    /** @var int $_rangeLength range length */
    protected $_rangeLength = null;

    /** @var int $_sortIndex sorted column index */
    protected $_sortIndex = null;

    /** @var int $_sortOrder sort order ("asc" or "desc") */
    protected $_sortOrder = null;

    /** @var array $_body body */
    protected $_body = array();

    /** @var array $_info info */
    protected $_info;

    /**
     * @see DataLoader_Interface#setRange(int,int)
     */
    public function setRange($start,$length)
    {
        $this->_rangeStart = $start;
        $this->_rangeLength = $length;
    }

    /**
     * @see DataLoader_Interface#setSort(int,int)
     */
    public function setSort($index,$order)
    {
        $this->_sortIndex = $index;
        $this->_sortOrder = $order;
    }

    /**
     * @see DataLoader_Interface#getBody()
     */
    public function getBody()
    {
        return $this->_body;
    }

    /**
     * @see DataLoader_Interface#getInfo()
     */
    public function getInfo()
    {
        return $this->_info;
    }
}