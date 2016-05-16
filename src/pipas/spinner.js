/**
 * User messages management
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    if (!pipas.overlay)console.error("Overlay must be declared before spinner", pipas);

    pipas.spinner = new function () {
        var inner = {
            defaultElement: $('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i>'),
            parents: {},
            getSelector: function (id) {
                return (id && id != "body") ? "#" + id : "body";
            },
            createSpinner: function (parent) {
                var parentSelector = this.getSelector(parent);
                var $parent = $(parentSelector).css("position", "relative");
                var $spinner = $parent.find("> .pipas-spinner");
                if (!$spinner.length) {
                    $spinner = $('<div class="pipas-spinner"></div>');
                    inner.defaultElement.clone().appendTo($spinner);
                    $spinner.appendTo($parent);
                }
                return $spinner;
            },
            setReserved: function ($elm, listObject) {
                var array = $.map(listObject, function (value) {
                    return [value];
                });
                $elm.attr("data-pipas-reserved", array.join(" "));
            }
        };
        /**
         * Show spinner with overlay defined by id on parent element
         * @param id
         * @param parent Parent ID
         */
        this.show = function (id, parent) {
            if (!parent)parent = "body";
            var $elm = inner.createSpinner(parent).show();
            var data = inner.parents[parent] || {idList: {}, elm: $elm};
            data.idList[id] = id;
            inner.parents[parent] = data;
            pipas.overlay.show(id, parent);
            if (parent != "body") {
                $elm.css("zIndex", 999);
            }

            inner.setReserved($elm, data.idList);
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
                        if (inner.parents[par].elm)inner.parents[par].elm.remove();
                        delete inner.parents[par];
                    } else {
                        inner.setReserved(inner.parents[par].elm, inner.parents[par].idList);
                    }
                    break;
                }
            }
            pipas.overlay.hide(id);
        };
        /**
         * Cancel element despite of all allocated required
         * @param {string|null} parent If is empty, remove all parents
         * @returns Element
         */
        this.cancel = function (parent) {
            if (parent == null) {
                for (var i in inner.parents) {
                    inner.parents[i].elm.remove();
                    delete inner.parents[i];
                }
            }
            if (inner.parents[parent]) {
                inner.parents[parent].elm.remove();
                delete inner.parents[parent];
            }
            pipas.overlay.cancel(parent);
        };

        /**
         * Get/Set default html element
         * @param jqueryObject|string
         * @returns {*}
         */
        this.defaultElement = function (jqueryObject) {
            if (jqueryObject == undefined)return inner.defaultElement;
            inner.defaultElement = 'string' == typeof jqueryObject ? $(jqueryObject) : jqueryObject;
            return this;
        }
    };
})(jQuery, pipas);