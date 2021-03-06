/**
 * Progress bar
 *
 * @copyright Copyright (c) 2016 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    if (!pipas.overlay)console.error("Overlay must be declared before progress", pipas);

    pipas.ProgressControl = function (id, _elm) {
        var val = 0;
        var max = 100;
        var percent = 0;
        var label = "&nbsp;";
        var oldAnimate = null;
        this.elm = _elm;
        var bar = _elm.find(".bar");
        bar.attr("value", 0).attr("max", max);
        this.setValue = function (value) {
            val = parseInt(value);
            if (isNaN(val))val = 0;
            percent = max > 0 ? Math.round(val / max * 100) : 0;
            if (val >= 0 && max >= 0) {
                bar.stop();
                if (oldAnimate) {
                    bar.attr("value", oldAnimate.value).attr("max", oldAnimate.max);
                }
                oldAnimate = {
                    value: val,
                    max: max
                };
                bar.animate(oldAnimate);
            }
            this.setLabel();
            if (this.isSuccess()) {
                for (var i in this.onSuccess) {
                    var cb = this.onSuccess[i];
                    cb();
                }
                this.close();
            }
            return this;
        };
        this.setMaximum = function (_max) {
            max = parseInt(_max ? _max : 100);
            _elm.find(".bar").attr("max", max);
            return this;
        };
        this.setLabel = function (_label) {
            label = _label ? _label : label;
            this.elm.find(".label").html(label + " " + percent + "%").show();
            return this;
        };
        this.isSuccess = function () {
            return val >= max;
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
    };
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
            }
        };
        /**
         * *
         * Show spinner with overlay defined by id on parent element
         * @param max
         * @param parent
         * @returns {pipas.ProgressControl}
         */
        this.show = function (parent) {
            var id = "progress-" + Math.round(Math.random() * 10000);
            if (!parent)parent = "body";
            if (inner.parents.hasOwnProperty(parent)) {
                inner.parents[parent].close();
            }
            var $elm = inner.createProgress(parent);
            var obj = new pipas.ProgressControl(id, $elm);

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