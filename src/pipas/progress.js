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
            factory: function (id, _elm, _max) {
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
                    if (this.elm)this.elm.remove();
                    pipas.overlay.hide(id);
                }
            }
        };
        /**
         * *
         * Show spinner with overlay defined by id on parent element
         * @param max
         * @param parent
         * @returns {inner.factory}
         */
        this.show = function (max, parent) {
            var id = "progress-" + Math.round(Math.random() * 10000);
            if (!parent)parent = "body";
            if (inner.parents.hasOwnProperty(parent)) {
                inner.parents[parent].close();
            }
            var $elm = inner.createProgress(parent);
            var obj = new inner.factory(id, $elm, max ? max : 100);

            inner.parents[parent] = obj;
            pipas.overlay.show(id, parent);
            if (parent != "body") {
                $elm.css("zIndex", 999);
            }
            return obj;
        };

        /**
         * Cancel element despite of all allocated required
         * @param {string|null} parent If is empty, remove all parents
         * @returns Element
         */
        this.cancel = function (parent) {
            if (parent == null) {
                for (var i in inner.parents) {
                    inner.parents[i].close();
                    delete inner.parents[i];
                }
            }
            if (inner.parents[parent]) {
                inner.parents[parent].close();
                delete inner.parents[parent];
            }
        };
    };
})(jQuery, pipas);