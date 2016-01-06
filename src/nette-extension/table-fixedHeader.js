/**
 * On Scroll fixed headers for tables
 *
 * for using apply class "table-fixedHeader" to table element
 */
(function ($, window) {
    $.nette.ext("table-fixedHeader", {
        init: function () {
            $(window)
                .on("scroll", {ext: this}, this.moveEvent)
                .on("resize", {ext: this}, this.remakeAndMoveEvent);
        },
        load: function () {
            this.remake();
            this.move();
        }
    }, {
        targetClass: "table-fixedHeader",
        headerClass: "fixed-header-of-table",
        tables: [],//list of tables under their fixed header id
        remakeAndMoveEvent: function (event) {
            var that = event.data.ext;
            that.remake();
            that.move();
        },
        moveEvent: function (event) {
            event.data.ext.move();
        },
        remake: function () {
            // Remove existing
            $("." + this.headerClass).remove();
            this.tables = [];
            //create new
            var ext = this;
            $("." + this.targetClass).each(function () {
                var $table = $(this);
                var id = ext.createId($table);
                ext.createHeader($table, id);
                ext.tables[id] = $table;
            });
        },
        move: function () {
            var bodyPadding = parseInt($('body').css('paddingTop'));
            var scrollTop = $(window).scrollTop();
            var scrollLeft = $(window).scrollLeft();
            for (var id in this.tables) {
                var offestStart = this.tables[id].offset().top - bodyPadding;
                var headerSize = this.tables[id].find('thead').height();
                var offsetEnd = offestStart + this.tables[id].height() - headerSize + bodyPadding;
                var $header = $("#" + this.tables[id].attr('data-fixed-header-id'));
                if (scrollTop >= offestStart && $header.is(":hidden") && scrollTop <= offsetEnd) {
                    $header.show();

                    var offsetLeft = $header.attr("data-leftOffset");
                    if (typeof offsetLeft === typeof undefined || offsetLeft === false) {
                        //Save left offset
                        $header.attr("data-leftOffset", $header.offset().left - scrollLeft);
                    }
                    $header.css('top', bodyPadding);
                }
                else if (scrollTop < offestStart || scrollTop > offsetEnd) {
                    $header.hide();
                }
                var headerLeftOffset = parseInt($header.attr("data-leftOffset"));
                if (headerLeftOffset) {
                    $header.css("left", headerLeftOffset - scrollLeft);
                }
            }
        },
        createId: function ($table) {
            var id = $table.attr('data-fixed-header-id') != null ? $table.attr('data-fixed-header-id') : 'fixed-header-' + Math.floor((Math.random() * 10000) + 1);
            $table.attr('data-fixed-header-id', id);
            return id;
        },
        createHeader: function ($table, id) {
            var $header = $($table[0].cloneNode(false));//clone tag without childs
            $header.attr('id', id);
            $header.addClass(this.headerClass);
            $table.after($header);

            //Fix header elements width
            $header.width($table.width());
            $table.find("> thead *").each(function () {
                $(this).width($(this).width());
            });
            $header.append($table.find("> thead").clone());
            $header.css({
                position: "fixed",
                top: 0,
                display: "none",
                borderBottom: "3px solid #666",
                zIndex: 950
            });
            return $header;
        }
    });
})(jQuery, window);