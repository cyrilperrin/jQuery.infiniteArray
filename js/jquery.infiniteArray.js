/**
 * jQuery plugin to create infinite array
 * @author Cyril Perrin
 * @license LGPL v3
 * @version 2013-06-21
 */
(function($) {
    /**
     * Create infinite array
     * @param url string JSON source URL
     * @param settings map settings
     * @param afterLoad function called function after first load
     * @return map infinite array object
     */
    $.fn.infiniteArray = function(url,settings,afterLoad) {
        // Aplly default settings for missing settings
        var settings = $.extend({
            // Behaviour
            loadingCount:200,       // Loaded rows at each loading (int)
            allLoadingCount:1000,   // Loaded rows at each loading when all rows are loaded (int) 
            loadingMargin:500,      // Margin before a new loading in pixels (int)
            onLoad:null,            // Called function after each loading (function)
            onComplete:null,        // Called function when array is complete (function)
            onClick:null,           // Called function when a row is clicked (function)
            onSelect:null,          // Called function when a row is selected (function)
            onUnselect:null,        // Called function when a row is unselected (function)
            onSelectAll:null,       // Called function when all rows are selected (function)
            onUnselectAll:null,     // Called function when all rows are unselected (function) 
            operationsChecker:null, // Called function to check each operations (function)
            
            // AJAX
            postParameters:{},     // POST parameters send to JSON flow (map)
            
            // Style
            arrayWidth:null,        // Array width in pixels or % (string)
            arrayHeight:400,        // Array height in pixels (int)
            columnsStyles:null,     // Colums styles in CSS (string[])
            columnsWidths:null,     // Columns widths in pixels or % (string[])
            columsTruncates:null,   // Columns truncates in caracters (int[])
            displayedColumns:null,  // Displayed columns indexes (int[])
            onRender:null,          // Called function when a row is rendered (function)
            
            // Selection
            isSelectableRows:false,     // Enable selection on rows ? (bool)
            isSelectionInputs:true,     // Display selection inputs ? (bool)
            isAllRowsSelectable:false,  // Enable selection on all rows ? (bool)
            isMultipleSelection:false,  // Enable multiple selection ? (bool)
            isSelectionOnClick:true,    // Enable selection on click ? (bool)
            isSelectionOnKeyboard:true,    // Enable selection on keyboard ?
            
            // Sort
            isSortableColumns:false, // Enable sort on columns ? (bool)
            sortableColumns:null,    // Sortable columns indexes (int[])
            defaultSortIndex:null,   // Default sort index (int)
            defaultSortOrder:null,   // Default sort order, "asc" or "desc" (string)
            
            // Messages
            loadingMessage:'Loading...',    // Loading message (string)
            noDataMessage:'No data',        // No data message (string)
            sortByMessage:'Sort by',        // Sort by message (string)
        }, settings);
        
        // Create/Return array object
        return new (function(url,settings,afterLoad,container) {
            // Keep "this" reference
            var self = this;
            
            /** @var url string url */
            this.url = url;
            
            /** @var settings map settins */
            this.settings = settings;
            
            /** @var data map data */
            this.data = null;
            
            /** @var loadedRows int loaded rows */
            this.loadedRows = 0;
            
            /** @var container jQuery container */
            this.container = container;
            
            /** @var head jQuery head */
            this.head = null;
            
            /** @var body jQuery body */
            this.body = null;
            
            /** @var loadingMessage jQuery loading message */
            this.loadingMessage = null;
            
            /** @var noDataMessage jQuery no data message */
            this.noDataMessage = null;
            
            /** @var scrollContainer jQuery scroll container */
            this.scrollContainer = null;
            
            /** @var scrollContent jQuery scroll content */
            this.scrollContent = null;
            
            /** @var widths columns widths */
            this.columnsWidths = null;
            
            /** @var isArrayCreated bool array created ? */
            this.isArrayCreated = false;
            
            /** @var isBlocked bool array is blocked ? */
            this.isBlocked = false;
            
            /** @var isComplete bool array is complete ? */
            this.isComplete = false;
            
            /** @var sortIndex int sort index */
            this.sortIndex = null;
            
            /** @var sortOrder string sort order, "asc" or "desc" */
            this.sortOrder = null; 
            
            /** @var timer ? timer to delay load request on collision */
            this.timer = null;
            
            /**
             * Initialize array
             * @param afterLoad function called function after first load
             */
            this.init = function(afterLoad) {
                // Show loading message
                self.container.html('<p class="infinite-array-loading">'+self.settings.loadingMessage+'</p>');
                
                // Default sort
                self.sortIndex = self.settings.defaultSortIndex;
                self.sortOrder = self.settings.defaultSortOrder;
                
                // Keyboard interaction
                if(
                    self.settings.isSelectableRows &&
                    !self.settings.isMultipleSelection &&
                    self.settings.isSelectionOnKeyboard
                ) {
                    // Listen keyboard events
                    $(document).keydown(function(event){
                        var tr = self.body.children('.infinite-array-selected');
                        if(tr.size() == 1) {
                            var index = tr.index();
                            if (event.keyCode == 38) { // Up
                                if(index != 0) {
                                    self.selectRow(index-1,true);
                                }
                                if (event.preventDefault) {
                                    event.preventDefault();
                                }
                                event.returnValue = false;
                            } else if(event.keyCode == 40) { // Down
                                if(index < self.loadedRows-1) {
                                    self.selectRow(index+1,true);
                                }
                                if (event.preventDefault) {
                                    event.preventDefault();
                                }
                                event.returnValue = false;
                            }
                        }
                    });
                }
                
                // Load data
                self.load(afterLoad);
            };
            
            /**
             * Load data
             * @param afterLoad function called function after load
             * @param loadingCount int loading count
             */
            this.load = function(afterLoad,loadingCount) {
                // Check if array is not blocked and not complete
                if(!self.isComplete) {
                    if(!self.isBlocked) {
                        // Block array
                        self.isBlocked = true;
    
                        // Loading count
                        if(loadingCount == null) {
                            loadingCount = self.settings.loadingCount;
                        }
                        
                        // Hide no data message
                        if(self.noDataMessage != null) {
                            self.noDataMessage.hide();
                        }
                        
                        // Show loading message
                        if(self.loadingMessage != null) {
                            self.loadingMessage.show();
                        }
                        
                        // Prepare request
                        var parameters = $.extend({
                            rangeStart:self.loadedRows,rangeLength:loadingCount
                        }, self.settings.postParameters);
                        if(self.sortIndex != null) {
                            parameters.sortIndex = self.sortIndex;
                            parameters.sortOrder = self.sortOrder;
                        }
                        
                        // Execute request
                        $.post(self.url,parameters,function(data) {
                            // Count loaded rows
                            self.loadedRows += data.body.length;
                            
                            // Remove columns
                            if(self.settings.displayedColumns != null) {
                                var inArray = [];
                                for(var i=0;i<data.head.length;i++) {
                                    if($.inArray(i,self.settings.displayedColumns) != -1) {
                                        inArray.push(true);
                                    } else {
                                        inArray.push(false);
                                        data.head.splice(i,1);
                                    }
                                }
                                for(var i=0;i<data.body.length;i++) {
                                    for(var j=0;j<data.body[i].length;j++) {
                                        if(!inArray[j]) {
                                            data.body[i].splice(j,1);
                                        }
                                    }
                                }
                            }
                            
                            // Save data
                            if(!self.isArrayCreated) {
                                self.data = data;
                            } else {
                                for(var i=0;i<data.body.length;i++) {
                                    self.data.body.push(data.body[i]);
                                }
                                if(typeof(data.info) != 'undefined') {
                                    for(var i=0;i<data.info.length;i++) {
                                        self.data.info.push(data.info[i]);
                                    }
                                }
                            }
                            
                            // Array is complete ?
                            if(data.body.length < loadingCount) {
                                self.isComplete = true;
                                
                                // Call function
                                if(self.settings.onComplete != null) {
                                    self.settings.onComplete.call(self.settings.onComplete);
                                }
                            }
                            
                            // Create/Fill array
                            if(!self.isArrayCreated) {
                                self.create(data);
                            } else {
                                self.fill(data);
                            }
                            
                            // Hide loading message
                            self.loadingMessage.hide();
                            
                            // Show no data message ?
                            if(self.loadedRows == 0) {
                                self.noDataMessage.show();
                            }
                            
                            // Array created 
                            self.isArrayCreated = true;
                            
                            // Unblock array
                            self.isBlocked = false;
                            
                            // Call onLoad function
                            if(self.settings.onLoad != null) {
                                self.settings.onLoad.call(self.settings.onLoad,self,data);
                            }
                            
                            // Call function
                            if(afterLoad != null) {
                                afterLoad.call(afterLoad,self);
                            }
                        },'json');
                    } else {
                        // Clear timer
                        clearTimeout(self.timer);
                        
                        // Set timeout
                        self.timer = setTimeout(function() {
                            self.load(afterLoad);
                        },1000);
                    }
                }
            };
            
            /**
             * Reload data
             * @param afterLoad function called function after load
             */
            this.reload = function(afterLoad) {                
                // Empty array
                self.empty();
                
                // Reload data
                self.load(afterLoad);
            };
            
            /**
             * Count data
             * @param result function called function after count
             */
            this.count = function(result) {
                // Prepare request
                var parameters = $.extend({count:true}, self.settings.postParameters);
                
                // Execute request
                $.post(self.url,parameters,function(data) {
                    result.call(result,data.count);
                },'json');
            };
            
            /**
             * Create infinite array
             * @param data map data
             */
            this.create = function(data) {
                // Offset
                var offset = self.settings.isSelectableRows && self.settings.isSelectionInputs ? 1 : 0;
                
                // Create array
                self.container.html(
                    '<table'+(self.settings.arrayWidth == null ? '' : ' style="width:'+self.settings.arrayWidth+';"')+'>'+
                        '<tbody>'+
                            '<tr>'+
                                '<td style="padding:0px;padding-right:20px;">'+
                                    '<table><thead><tr></tr></thead></table>'+
                                '</td>'+
                            '</tr>'+
                            '<tr>'+
                                '<td colspan="'+(data.head.length+1+offset)+'" style="position:relative;padding:0px;">'+
                                    '<p class="infinite-array-loading" style="display:none;position:absolute;">'+self.settings.loadingMessage+'</p>'+
                                    '<p class="infinite-array-nodata" style="display:none;position:absolute;">'+self.settings.noDataMessage+'</p>'+
                                    '<div style="overflow:auto;height:'+self.settings.arrayHeight+'px;">'+
                                        '<div style="overflow:auto;">'+
                                            '<table><tbody></tbody></table>'+
                                        '</div>'+
                                    '</div>'+
                                '</td>'+
                            '</tr>'+
                        '</tbody>'+
                    '</table>'
                );
                
                // Find elements
                self.head = self.container.find('thead:eq(0)');
                self.body = self.container.find('tbody:eq(1)');
                self.loadingMessage = self.container.find('.infinite-array-loading');
                self.noDataMessage = self.container.find('.infinite-array-nodata');
                self.scrollContainer = self.container.find('div:eq(0)');
                self.scrollContent = self.container.find('div:eq(1)');
                
                // Fill head
                if(self.settings.isSelectableRows && self.settings.isSelectionInputs) {
                    // Add selection column
                    self.head.children().append('<th style="width:20px;">'+(self.settings.isAllRowsSelectable ? '<input type="checkbox" />' : '<input type="checkbox" disabled="disabled" />')+'</th>');
                    
                    // Listen change events
                    if(self.settings.isAllRowsSelectable) {
                        self.head.find('input:first').change(function() {
                            if(self.head.find('input:first').is(':checked')) {
                                self.selectAll();
                            } else {
                                self.unselectAll();
                            }
                        });
                    }
                }
                for(var i=0;i<data.head.length;i++) {
                    // Width
                    var styleWidth = self.settings.columnsWidths == null ? '' : 'width:'+self.settings.columnsWidths[i]+';';
                    
                    // Cursor
                    var styleCursor = self.settings.isSortableColumns == false ? '' : 'cursor:pointer;';
                    
                    // Class
                    var classes = []; 
                    if(self.settings.isSortableColumns && (self.settings.sortableColumns == null || $.inArray(i,self.settings.sortableColumns) != -1)) {
                        classes.push('infinite-array-sortable');
                    }
                    if(self.sortIndex != null && self.sortIndex == i) {
                        if(self.sortOrder == 'asc') {
                            classes.push('infinite-array-sorted-asc');
                        } else if(self.sortOrder == 'desc') {
                            classes.push('infinite-array-sorted-desc');
                        }
                    }
                    var attrClass = ' class="'+classes.join(' ')+'"';
                    
                    // Tooltip
                    var attrTitle = self.settings.isSortableColumns == false ? '' : ' title="'+self.settings.sortByMessage+' &quot;'+self.escapeHTML(data.head[i])+'&quot;"';
                    
                    // Create cell
                    self.head.children().append('<th style="'+styleWidth+styleCursor+'"'+attrClass+attrTitle+'>'+self.escapeHTML(data.head[i])+'</th>');
                    
                    // Listen click events
                    if(self.settings.isSortableColumns && (self.settings.sortableColumns == null || $.inArray(i,self.settings.sortableColumns) != -1)) {
                        self.head.find('th').last().click(function() {
                            self.sort($(this).index()-offset);
                        });
                    }
                }
                
                // Get columns widths
                self.columnsWidths = [];
                for(var i=0;i<data.head.length;i++) {
                    self.columnsWidths[i] = $(self.head.find('th').get(i+offset)).width()+'px';
                }
                
                // Fill body
                self.fill(data);
                
                // Listen scroll events
                self.scrollContainer.scroll(function() {
                    if(!self.isBlocked && self.scrollContent.height()-self.scrollContainer.height()-self.scrollContainer.scrollTop() < self.settings.loadingMargin) {
                        self.load();
                    }
                });
                
                // Center loading/no data messages
                self.loadingMessage.css('margin-top',Math.min(50,(self.scrollContainer.height()-self.loadingMessage.height())/2-20));
                self.loadingMessage.css('margin-left',(self.scrollContainer.width()-self.loadingMessage.width())/2);
                self.noDataMessage.css('margin-top',Math.min(50,(self.scrollContainer.height()-self.loadingMessage.height())/2-20));
                self.noDataMessage.css('margin-left',(self.scrollContainer.width()-self.loadingMessage.width())/2);
            };
            
            /**
             * Fill infinite array
             * @param data map data
             */
            this.fill = function(data) {
                // Class attribute
                var classes = [];
                if(self.settings.isSelectableRows) {
                    classes.push('infinite-array-selectable');
                }
                if(self.settings.onClick != null || settings.isSelectionOnClick && settings.isSelectableRows) {
                    classes.push('infinite-array-clickable');
                }
                var attrClass = classes.length == 0 ? '' : ' class="'+classes.join(' ')+'"';
                
                // Fill body
                var trs = [];
                for(var i=0;i<data.body.length;i++) {
                    trs.push('<tr',attrClass,'>');
                    if(self.settings.isSelectableRows && self.settings.isSelectionInputs) {
                        trs.push('<td style="width:20px;"><input type="',self.settings.isMultipleSelection ? 'checkbox' : 'radio','" /></td>');
                    }
                    for(var j=0;j<data.body[i].length;j++) {
                        trs.push('<td class="infinite-array-td-',j,'" style="width:',self.columnsWidths[j],';',(self.settings.columnsStyles != null && typeof self.settings.columnsStyles[j] != 'undefined' ? self.settings.columnsStyles[j] : ''),'">');
                        if(self.settings.columsTruncates != null && self.settings.columsTruncates[j] != null) {
                            trs.push(
                                '<span title="',
                                self.escapeHTML(data.body[i][j]),'">',
                                self.escapeHTML(new String(data.body[i][j]).substring(0,self.settings.columsTruncates[j])),
                                '</span>'
                            );
                        } else {
                            trs.push(self.escapeHTML(data.body[i][j]));
                        }
                        trs.push('</td>');
                    }
                    trs.push('</tr>');
                }
                self.body.append(trs.join(''));
                
                // Start index
                var startIndex = self.loadedRows-data.body.length;
                
                // Get new rows
                var trs = self.body.children().slice(startIndex);

                // Listen click events
                if(self.settings.isSelectableRows && self.settings.isSelectionInputs) {
                    $.each(trs.find('td:first > input'),function(index) {
                        $(this).click(function() {
                            index += startIndex;
                            var input = $(this);
                            if(!input.parent().parent().is('.infinite-array-selected')) {
                                input.prop('checked',false);
                                self.selectRow(index,true);
                            } else {
                                input.prop('checked',true);
                                self.unselectRow(index);
                            }
                        });
                    });
                }
                
                // Listen click events
                if(self.settings.onClick != null || settings.isSelectionOnClick && settings.isSelectableRows) {            
                    $.each(trs,function(index) {
                        index += startIndex;
                        var tds = $(this).children();
                        if(self.settings.isSelectableRows) {
                            tds = tds.slice(1);
                        }
                        tds.click(function() {
                            // Select/Unselect row
                            if(settings.isSelectionOnClick && settings.isSelectableRows) {
                                if(self.isSelectedRow(index)) {
                                    self.unselectRow(index);
                                } else {
                                    self.selectRow(index,true);
                                }
                            }
                            
                            // Call click function
                            if(self.settings.onClick != null) {
                                self.settings.onClick.call(self.settings.onClick,self,index,$($(this).parent()));
                            }
                        });
                    });
                }
                
                
                // Call render function
                if(self.settings.onRender != null) {
                    $.each(trs,function(index) {
                        self.settings.onRender.call(self.settings.onRender,self,index+startIndex,$(this));
                    });
                }
            };
            
            /**
             * Empty array
             */
            this.empty = function() {
                // Array is no more complete
                self.isComplete = false;
                
                // Reset loaded rows
                self.loadedRows = 0;

                // Remove rows from html
                self.body.empty();
                
                // Remove rows from data
                self.data.body = [];
                if(typeof(self.data.info) != 'undefined') {
                    self.data.info = [];
                }
            };
            
            /**
             * Sort a column
             * @param index int column index
             * @param afterLoad function called function after load
             */
            this.sort = function(index,afterLoad) {
                self.execute(function() {
                    // Empty array
                    self.empty();
                    
                            
                    // Sort index
                    if(self.sortIndex == index) {
                        self.sortOrder = self.sortOrder == 'asc' ? 'desc' : 'asc';  
                    } else {
                        self.sortOrder = 'asc';
                        self.sortIndex = index;
                    }
                    
                    // Set class
                    self.head.find('th.infinite-array-sorted-asc').removeClass('infinite-array-sorted-asc');
                    self.head.find('th.infinite-array-sorted-desc').removeClass('infinite-array-sorted-desc');
                    var offset =  self.settings.isSelectableRows && self.settings.isSelectionInputs ? 1 : 0;
                    self.head.children().children().eq(self.sortIndex+offset).addClass(self.sortOrder == 'asc' ? 'infinite-array-sorted-asc' : 'infinite-array-sorted-desc');
                    
                    // Load data
                    self.load(afterLoad);
                },'sort',{index:index});
            };
            
            /**
             * Cancel sort
             * @param afterLoad function called function after load
             */
            this.cancelSort = function(afterLoad) {
                // Empty array
                self.empty();
                
                // Set sort to null
                self.sortOrder = null;
                self.sortIndex = null;
                
                // Remove class class
                self.head.find('th.infinite-array-sorted-asc').removeClass('infinite-array-sorted-asc');
                self.head.find('th.infinite-array-sorted-desc').removeClass('infinite-array-sorted-desc');
                
                // Load data
                self.load(afterLoad);
            };
            
            /**
             * Listen an input
             * @param name string associated POST parameter to sent to JSON flow
             * @param input jQuery input to listen
             * @param afterLoad function called function after load
             * @param beforeLoad function called function before load
             */
            this.listen = function(name,input,afterLoad,beforeLoad) {
                // Declare timer
                var timer = null;
                
                // Save current value
                var lastValue = input.val();
                
                // Listen key events
                input.keyup(function() {
                    // Check if value has changed
                    if(lastValue != input.val()) {
                        // Save current value
                        lastValue = input.val();
                        
                        // Clear timer
                        clearTimeout(timer);
                        
                        // Set timeout
                        timer = setTimeout(function() {
                            // Set POST parameter
                            self.settings.postParameters[name] = input.val();
                            
                            // Call function
                            if(beforeLoad != null) {
                                beforeLoad.call(beforeLoad,self);
                            }
                            
                            // Reload data
                            self.reload(afterLoad);
                        },1000);
                    }
                });
            };
            
            /**
             * Select a row
             * @param index int row index
             * @param showRow bool show row ?
             */
            this.selectRow = function(index,showRow) {
                self.execute(function() {
                    // Unselect others rows ?
                    if(!self.settings.isMultipleSelection) {
                        self.unselectAll();
                    }
                    
                    // Select row
                    var tr = $(self.body.children().get(index));
                    if(self.settings.isSelectionInputs) {
                        tr.find('td:first > input').prop('checked',true);
                    }
                    tr.addClass('infinite-array-selected');
                    
                    // Call onSelect method
                    if(self.settings.onSelect != null) {
                        self.settings.onSelect.call(self.settings.onSelect,self,index,tr);
                    }
                    
                    // Show row
                    if(showRow) {
                        self.showRow(index);
                    }
                },'selectRow',{index:index});
            };
            
            /**
             * Unselect a row
             * @param index int row index
             */
            this.unselectRow = function(index) {
                self.execute(function() {
                    // Unselect row
                    var tr = $(self.body.children().get(index));
                    if(self.settings.isSelectionInputs) {
                        tr.find('td:first > input').prop('checked',false);
                    }
                    tr.removeClass('infinite-array-selected');
                    
                    // Call onUnselect method
                    if(self.settings.onUnselect != null) {
                        self.settings.onUnselect.call(self.settings.onUnselect,self,index,tr);
                    }
                },'unselectRow',{index:index});
            };
            
            /**
             * Show row
             * @param index int row index
             */
            this.showRow = function(index) {
                // Show row
                var tr = $(self.body.children().get(index));
                var position = tr.position();
                if(position.top < 0) {
                    self.scrollContainer.scrollTop(self.scrollContainer.scrollTop()+position.top);
                } else if(position.top+tr.height() > self.scrollContainer.height()) {
                    self.scrollContainer.scrollTop(self.scrollContainer.scrollTop()+position.top-self.scrollContainer.height()+tr.height());
                }
            };
            
            /**
             * Select all rows
             */
            this.selectAll = function() {
                self.execute(function() {
                    // Load all
                    self.loadAll();
                    
                    // Select all rows
                    var trs = self.body.children(':not(.infinite-array-selected)');
                    if(self.settings.isSelectionInputs) {
                        // Select row
                        trs.find('td:first > input').prop('checked',true);
                        
                        // Call onSelect method
                        if(self.settings.onSelect != null) {
                            $.each(trs,function(index,tr) {
                                self.settings.onSelect.call(self.settings.onSelect,self,$(tr).index(),$(tr));
                            });
                        }
                    }
                    trs.addClass('infinite-array-selected');
                    
                    // Call onSelectAll method
                    if(self.settings.onSelectAll != null) {
                        self.settings.onSelectAll.call(self.settings.onSelectAll,self);
                    }
                },'selectAll');
            };
            
            /**
             * Unselect all rows
             */
            this.unselectAll = function() {
                self.execute(function() {
                    // Unselect all rows
                    var trs = self.body.children('.infinite-array-selected');
                    if(self.settings.isSelectionInputs) {
                        // Unselect row
                        trs.find('td:first > input').prop('checked',false);
                        
                        // Call onUnselect method
                        if(self.settings.onUnselect != null) {
                            $.each(trs,function(index,tr) {
                                self.settings.onUnselect.call(self.settings.onUnselect,self,$(tr).index(),$(tr));
                            });
                        }
                    }
                    trs.removeClass('infinite-array-selected');
                    
                    // Call onUnselectAll method
                    if(self.settings.onUnselectAll != null) {
                        self.settings.onUnselectAll.call(self.settings.onUnselectAll,self);
                    }
                },'unselectAll');
            };
            
            /**
             * Load all rows
             * @param afterLoad function called function after load
             */
            this.loadAll = function(afterLoad) {
                self.execute(function() {
                    self.load(function() {
                        if(!self.isComplete) {
                            self.load(self.settings.allLoadingCount,this);
                        } else {
                            afterLoad.call(afterLoad,self);
                        }
                    },self.settings.allLoadingCount);
                },'loadAll');
            };
            
            /**
             * Execute an operation if it's allowed
             * @param operation function operation
             * @param name string operation name
             * @param parameters map operation parameters
             */
            this.execute = function(operation,name,parameters) {
                // Check operation ?
                if(self.settings.operationsChecker == null) {
                    // Execute operation
                    operation.call();
                } else {
                    // Send operation to operations checker
                    self.settings.operationsChecker.call(self.settings.operationsChecker,self,operation,name,parameters);
                }
            };
            
            /**
             * Get selected rows
             * @return array selected rows indexes
             */
            this.getSelectedRows = function() {
                // Get selected rows indexes
                var indexes = [];
                $.each(self.body.children('.infinite-array-selected'),function(index,tr) {
                    indexes.push($(tr).index());
                });
                return indexes;
            };
            
            /**
             * Check if a row is selected
             * @param index int row index
             * @return bool row is selected ?
             */
            this.isSelectedRow = function(index) {
                return $(self.body.children().get(index)).is('.infinite-array-selected');
            };
            
            /**
             * Get row body content
             * @param index int row index
             * @return array row body content
             */
            this.getRowBodyContent = function(index) {
                return typeof(self.data.body[index]) != 'undefined' ? self.data.body[index] : null;
            };
            
            /**
             * Get selected cell body content
             * @param index int column index
             * @return array selected cell body content 
             */
            this.getSelectedCellBodyContent = function(index) {
                var content = [];
                var selectedRows = self.getSelectedRows();
                for(var i=0;i<selectedRows.length;i++) {
                    content.push(self.data.body[selectedRows[i]][index]);
                }
                return content;
            };
            
            /**
             * Get row info content
             * @param index int row index
             * @return array row info content
             */
            this.getRowInfoContent = function(index) {
                return typeof(self.data.info[index]) != 'undefined' ? self.data.info[index] : null;
            };
            
            /**
             * Get selected cell info content
             * @param index int column index
             * @return array selected cell info content 
             */
            this.getSelectedCellInfoContent = function(index) {
                var content = [];
                var selectedRows = self.getSelectedRows();
                for(var i=0;i<selectedRows.length;i++) {
                    content.push(self.data.info[selectedRows[i]][index]);
                }
                return content;
            };
            
            /**
             * Escape HTML
             * @param string string string
             * @retur string escaped string
             */
            this.escapeHTML = function(string) {
                return String(string)
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            };
            
            // Init array
            this.init(afterLoad);
        })(url,settings,afterLoad,this);
    };
})(jQuery);