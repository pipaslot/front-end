/**
 * Progress bar
 *
 * @copyright Copyright (c) 2016 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    if (!pipas.overlay)console.error("Overlay must be declared before progress", pipas);

    pipas.progress = new function () {
        var inner = {
            defaultElement: $('<div class="pipas-progress"><div class="wrapper"><div class="label">&nbsp;</div><progress class="bar" value="0" max="100"></progress></div></div>'),
            parents: {},
            getSelector: function (id) {
                return (id && id != "body") ? "#" + id : "body";
            },
            createProgress: function (parent) {
                var parentSelector = this.getSelector(parent);
                var $parent = $(parentSelector).css("position", "relative");
                var $spinner = $parent.find("> .pipas-progress");
                if (!$spinner.length) {
                    $spinner = inner.defaultElement.clone();
                    $spinner.appendTo($parent);
                }
                return $spinner;
            },
            setReserved: function ($elm, listObject) {
                var array = $.map(listObject, function (value) {
                    return [value];
                });
                $elm.attr("data-pipas-reserved", array.join(" "));
            },
            factory: function (_id, _elm, _max) {
                var max = parseInt(_max ? _max : 100);
                var percent = 0;
                var label = "&nbsp;";
                this.elm = _elm;

                _elm.find(".bar").attr("value", 0).attr("max", max);
                this.setValue = function (value) {
                    var val = parseInt(value);
                    percent = Math.round(value / max * 100);
                    this.elm.find(".bar").stop().animate({
                        value: val,
                        max: max
                    });
                    this.setLabel();
                    if (val >= max) {
                        for (var i in this.onSuccess) {
                            var cb = this.onSuccess[i];
                            cb();
                        }
                        this.close();
                    }
                };
                this.setLabel = function (_label) {
                    label = _label ? _label : label;
                    this.elm.find(".label").html(label + " " + percent + "%").show();
                };
                /**
                 * List of callbacks called after success
                 * @type {Array}
                 */
                this.onSuccess = [];
                this.close = function () {
                    pipas.progress.hide(_id);
                }
            }
        };
        /**
         * *
         * Show spinner with overlay defined by id on parent element
         * @param id
         * @param max
         * @param parent
         * @returns {inner.factory}
         */
        this.show = function (id, max, parent) {
            if (!id)id = "progress-" + Math.round(Math.random() * 10000);
            if (!parent)parent = "body";

            var $elm = inner.createProgress(parent);
            var obj = new inner.factory(id, $elm, max ? max : 100);
            var data = inner.parents[parent] || {idList: {}, cnt: obj};
            data.idList[id] = id;
            inner.parents[parent] = data;
            pipas.overlay.show(id, parent);
            if (parent != "body") {
                $elm.css("zIndex", 999);
            }

            inner.setReserved($elm, data.idList);
            return obj;
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
                        if (inner.parents[par].cnt)inner.parents[par].cnt.elm.remove();
                        delete inner.parents[par];
                    } else {
                        inner.setReserved(inner.parents[par].cnt.elm, inner.parents[par].idList);
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
                    inner.parents[i].cnt.elm.remove();
                    delete inner.parents[i];
                }
            }
            if (inner.parents[parent]) {
                inner.parents[parent].cnt.elm.remove();
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


/*
 * Progress
 *
 var DNwebUIProgress = function () {
 var overlay = new DNwebUIOverlay();
 var progress = {
 elementSelector: ".dnweb-progress",
 createElement: function ($parent) {
 var elm = $('<div class="dnweb-progress"></div>')
 .append($('<div class="dnweb-progress-label"></div>'))
 .append($('<progress class="dnweb-progress-bar" value="0" max="100"></progress>'));
 return elm;
 },
 run: function ($elm, $parent, stackEmpty) {
 if (stackEmpty) {
 $elm.find(".dnweb-progress-bar").attr("value", 0)
 $elm.hide();
 } else {
 $elm.show();
 }
 }
 };
 /**
 * Progress - Zobrazení
 *
 this.show = function (id, value, max, parent, label) {

 value = parseInt(value);
 max = parseInt(max);
 var percent = 0;
 if (max > 0) {
 percent = Math.round(value / max * 100);
 }
 if ($elm.css("display") == "none") {
 $elm.find(".dnweb-progress-bar").attr("value", value).attr("max", max);
 }
 $elm.find(".dnweb-progress-label").html(label + " " + percent + "%");
 $elm.find(".dnweb-progress-bar").stop().animate({
 value: value,
 max: max
 });
 return $elm;
 }
 /**
 * Progress - Skrytí
 *
 this.hide = function (id, parent) {
 var overlaySelector = overlay.hide(id + "-progress", parent);
 this.dnwebUI.runSection(progress, overlaySelector, id, false);
 }
 }*/