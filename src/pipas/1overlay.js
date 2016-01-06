/**
 * Overlay management
 * - Enables define overlay for multiple events for one target container
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    pipas.overlay = new function () {
        var inner = {
            parents: [],
            getSelector: function (id) {
                return (id && id != "body") ? "#" + id : "body";
            },
            getOverlay: function (parent) {
                var parentSelector = this.getSelector(parent);
                var $parent = $(parentSelector);
                var $elm = $parent.find("> .pipas-overlay");
                if (!$elm.length) {
                    $elm = $('<div class="pipas-overlay"></div>');
                    $parent.append($elm);
                }
                if ($parent.selector != "body") {
                    $elm.css("zIndex", 998);
                }
                return $elm
            },
            setReserved: function ($elm, listObject) {
                var array = $.map(listObject, function (value) {
                    return [value];
                });
                $elm.attr("data-pipas-reserved", array.join(" "));
            }
        };
        /**
         * Show Overlay defined by ID in parent element
         * @param id
         * @param parent Parent ID
         * @returns {*}
         */
        this.show = function (id, parent) {
            var $elm = inner.getOverlay(parent);
            var data = inner.parents[parent] || {idList: {}, elm: $elm};
            data.idList[id] = id;
            inner.parents[parent] = data;
            $elm.show();
            inner.setReserved($elm, data.idList);
            return $elm;
        };
        /**
         * Hide overlay order by id
         * @param {string} id
         */
        this.hide = function (id) {
            for (var par in inner.parents) {
                if (inner.parents.hasOwnProperty(par) && inner.parents[par].idList[id]) {
                    delete inner.parents[par].idList[id];
                    if (Object.keys(inner.parents[par].idList).length == 0) {
                        if(inner.parents[par].elm)inner.parents[par].elm.remove();
                        delete inner.parents[par];
                    } else {
                        inner.setReserved(inner.parents[par].elm, inner.parents[par].idList);
                    }
                    break;
                }
            }
        };
        /**
         * Cancel element despite of all allocated required
         * @param parent
         */
        this.cancel = function (parent) {
            if(inner.parents[parent]) {
                inner.parents[parent].elm.remove();
                delete inner.parents[parent];
            }
        }
    };
})(jQuery, pipas);