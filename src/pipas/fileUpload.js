/**
 * Progress bar
 *
 * @copyright Copyright (c) 2016 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    if (!pipas.progress)console.error("Progress must be declared before file upload", pipas);

    pipas.fileUpload = function (fileInputSelector, uploadUrl, onSuccess, statusUrl) {
        if (!onSuccess)onSuccess = function () {

        };
        var parent = "body";
        var getStatus = function (progress) {
            if (!statusUrl) {
                onSuccess();
            }
            if (!progress)progress = pipas.progress.show(parent)
            progress.setLabel("Processing:");
            $.ajax({
                type: 'GET',
                url: statusUrl,
                redirect: false,
                spinner: false,
                async: true,
                success: function (payload) {
                    if (!progress.isSuccess()) {
                        if (typeof payload == 'string') {
                            progress.setValue(payload);
                        } else {
                            progress.setValue(payload.status);
                        }
                        setTimeout(function () {
                            getStatus(progress);
                        }, 300);
                    } else {
                        onSuccess();
                    }
                }
            });
        };
        var onChange = function () {
            var form = $(this).parents("form");
            if ($(this).get(0).files.length > 0) {
                var progress;
                $.nette.ajax({
                    spinner: false,
                    redirect: false,
                    url: uploadUrl,
                    type: 'POST',
                    async: true,
                    data: new FormData(form[0]),
                    dataType: 'json',
                    cache: false,
                    contentType: false,
                    processData: false,
                    xhr: function () {
                        var myXhr = $.ajaxSettings.xhr();
                        if (myXhr.upload) {
                            myXhr.upload.addEventListener('progress', function (e) {
                                if (e.lengthComputable && progress) {
                                    progress.setMaximum(e.total);
                                    progress.setValue(e.loaded);
                                    progress.setLabel("Loading: ");
                                    if (progress.isSuccess()) {
                                        getStatus();
                                    }
                                }
                            }, false);
                        }
                        return myXhr;
                    },
                    beforeSend: function () {
                        progress = pipas.progress.show(parent);
                    },
                    success: function () {
                        if (progress)progress.close();
                    },
                    error: function (jqXHR, status, error) {
                        pipas.message.showError("Failed to upload files");
                        if (progress)progress.close();
                    }
                });
            }
            else console.log("No file selected");
        };
        $(fileInputSelector).off('change', onChange).on('change', onChange);
    };
})(jQuery, pipas);