/*
 * Ajax upload control
 *
 * Assigned to input file for uploading of file with progress bar
 * Example: <input type="file" name="photos" data-upload-url="" multiple>
 *
 * Attributes:
 * data-upload-url - Upload script
 * data-upload-status-url - Url for obtaining of upload processing status
 * data-upload-on-upload - Javascript callback after uploading
 * data-upload-on-success - Javascript callback after uploading and finishes processing
 */
(function ($, upload) {
    $.nette.ext('upload', {

        load: function () {
            var self = this;
            for (var i in self.registered) {
                self.registered[i].destroy();
            }
            var selector = "input[type='file'][data-upload-url]";
            $(selector).each(function () {
                var $elm = $(this);
                var id = $elm.attr("id");
                if (!id) {
                    id = "fileUploadControl-" + Math.floor((Math.random() * 10000) + 1);
                    $elm.attr("id", id);
                }
                var uploadUrl = $elm.attr("data-upload-url");
                var control = pipas.upload.create("#" + id, uploadUrl);
                if ($elm.attr("data-upload-status-url")) {
                    control.processingStatusUrl = $elm.attr("data-upload-status-url");
                }
                if ($elm.attr("data-upload-on-upload")) {
                    control.onUpload.push(function () {
                        eval($elm.attr("data-upload-on-upload"));
                    });
                }
                if ($elm.attr("data-upload-on-success")) {
                    control.onSuccess.push(function () {
                        eval($elm.attr("data-upload-on-success"));
                    });
                }
                self.registered[id] = control;
            });
        }
    }, {
        registered: {}
    });
})(jQuery, pipas.upload);
