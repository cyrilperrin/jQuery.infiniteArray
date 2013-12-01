<?php

namespace CyrilPerrin\InfiniteArray;

/**
 * Flow
 */
class Flow
{

    /** @var $_dataLoader DataLoader_Interface data loader */
    private $_dataLoader;

    /**
     * Constructor
     * @param $dataLoader DataLoader_Interface data loader
     */
    public function __construct(DataLoader_Interface $dataLoader)
    {
        $this->_dataLoader = $dataLoader;
    }

    /**
     * To string
     * @return string json flow
     */
    public function __toString()
    {
        // Count/Load data
        if (array_key_exists('count', $_POST) && $_POST['count'] == 'true') {
            // Count data
            $count = $this->_dataLoader->count();

            // Construct data
            $data = array('count' => $count);
        } else {
            // Set range
            if (array_key_exists('rangeStart', $_POST) &&
            array_key_exists('rangeLength', $_POST) &&
            $_POST['rangeStart'] !== null && $_POST['rangeLength'] !== null) {
                if (preg_match('/^[0-9]+$/', $_POST['rangeStart']) &&
                preg_match('/^[0-9]+$/', $_POST['rangeLength'])) {
                    $this->_dataLoader->setRange(
                        $_POST['rangeStart'], $_POST['rangeLength']
                    );
                }
            }

            // Set sort
            if (array_key_exists('sortIndex', $_POST) &&
            array_key_exists('sortOrder', $_POST) && 
            $_POST['sortIndex'] !== null && $_POST['sortOrder'] !== null) {
                if (preg_match('/^[0-9]+$/', $_POST['sortIndex']) &&
                in_array(strtolower($_POST['sortOrder']), array('asc','desc'))) {
                    $this->_dataLoader->setSort(
                        $_POST['sortIndex'], strtolower($_POST['sortOrder'])
                    );
                }
            }

            // Load data
            $this->_dataLoader->load();

            // Construct data
            $data = array(
                'head' => $this->_dataLoader->getHead(),
                'body' => $this->_dataLoader->getBody()
            );
            if ($info = $this->_dataLoader->getInfo()) {
                $data['info'] = $info;
            }
        }

        // Encode/Return data
        return json_encode($data);
    }
}