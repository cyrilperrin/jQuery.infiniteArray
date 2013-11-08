<?php

namespace CyrilPerrin\InfiniteArray;

/**
 * Interface to implement to be considered as data loader
 */
interface DataLoader_Interface
{
    /**
     * Set range
     * @param $start int start
     * @param $length int length
     */
    public function setRange($start,$length);

    /**
     * Set sorted column index
     * @param $index int sorted column index
     * @param $order string order ("asc" or "desc")
    */
    public function setSort($index,$order);

    /**
     * Load data
    */
    public function load();

    /**
     * Count data
     * @return int count
    */
    public function count();

    /**
     * Get head
     * @return array head
    */
    public function getHead();

    /**
     * Get body
     * @return array body
    */
    public function getBody();

    /**
     * Get info
     * @return array info
    */
    public function getInfo();
}