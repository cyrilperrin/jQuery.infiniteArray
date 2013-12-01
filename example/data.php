<?php

// Require autoload
require('autoload.php');

// Add vendor directory to include path
set_include_path(get_include_path().PATH_SEPARATOR.__DIR__.'/../php/vendor');

/**
 * Data loader for CSV files
 */
class DataLoader_CSV extends CyrilPerrin\InfiniteArray\DataLoader_Abstract
{
    /** @var $_path string CSV file path */
    private $_path;
    
    /** @var $_filter callback filter */
    private $_filter;
    
    /**
     * Constructor
     * @param $path string CSV file path
     * @param $head array head
     * @param $filter callback filter 
     */
    public function __construct($path,$head,$filter=null)
    {
        $this->_path = $path;
        $this->_head = $head;
        $this->_filter = $filter;
    }
    
    /**
     * @see IInfiniteArrayDataLoader#getHead()
     */
    public function getHead()
    {
        return $this->_head;
    }

    /**
     * @see IInfiniteArrayDataLoader#load()
     */
    public function load()
    {
        // Read data
        $fp = fopen($this->_path, 'r');
        while ($line = fgetcsv($fp)) {
            if ($this->_filter == null || call_user_func($this->_filter, $line)) {
                $this->_body[] = $line;
            }
        }
        fclose($fp);
        
        // Sort data
        if ($this->_sortIndex !== null && $this->_sortOrder !== null) {
            $sortIndex = $this->_sortIndex;
            $sortOrder = $this->_sortOrder;
            usort(
                $this->_body, function($dataA,$dataB) use($sortIndex,$sortOrder) {
                    return ($sortOrder == 'asc' ? 1 : -1)*strcmp($dataA[$sortIndex], $dataB[$sortIndex]);
                }
            );
        }
        
        // Slice data
        if ($this->_rangeStart !== null && $this->_rangeLength !== null) {
            $this->_body = array_slice(
                $this->_body, $this->_rangeStart, $this->_rangeLength
            );
        }
    }

    /**
     * @see IInfiniteArrayDataLoader#count()
     */
    public function count()
    {
        // Init count
        $count = 0;
        
        // Count data
        $this->_body = array();
        $fp = fopen($this->_path, 'r');
        while ($line = fgetcsv($fp)) {
            $count++;
        }
        fclose($fp);
        
        // Return count
        return $count;
    }
}


// Write data
echo new CyrilPerrin\InfiniteArray\Flow(
    new DataLoader_CSV(
        'data.csv',
        array(
            'Region name',
            'Department name',
            'Departement number',
            'ID',
            'Name',
            'Zip code',
            'INSEE code',
            'Latitude',
            'Longitude',
            'Population'
        ),
        function($line) {
            return !array_key_exists('name', $_POST) ||
                   $_POST['name'] === '' ||
                   stripos($line[4], $_POST['name']) !== false;
        }
    )
);