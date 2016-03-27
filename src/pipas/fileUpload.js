/**
 * Progress bar
 *
 * @copyright Copyright (c) 2016 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    if (!pipas.progress)console.error("Progress must be declared before file upload", pipas);
    pipas.FileUploadControl = function (elementSelector, uploadUrl) {
        var self = this;
        var uploadProgress, processingProgress;
        var callSuccess = function () {
            for (var i in self.onSuccess) {
                self.onSuccess[i].call(self);
            }
        };
        var getStatus = function () {
            if (!self.processingStatusUrl) {
                callSuccess();
            }
            if (!processingProgress) {
                processingProgress = pipas.progress.show(self.progressContainerId);
                processingProgress.setLabel(self.text.processing);
            }
            $.ajax({
                type: 'GET',
                url: self.processingStatusUrl,
                redirect: false,
                spinner: false,
                async: true,
                success: function (payload) {
                    if (typeof payload == 'string') {
                        processingProgress.setValue(payload);
                    } else {
                        processingProgress.setValue(payload.status);
                    }
                    if (!processingProgress.isSuccess()) {
                        setTimeout(function () {
                            getStatus();
                        }, 300);
                    } else {
                        callSuccess();
                    }
                }
            });
        };
        var onChange = function () {
            if (self.element.get(0).files.length > 0) {
                var ajaxData = new FormData();
                ajaxData.append('action', 'uploadImages');
                var iterator = 0;
                $.each(self.element, function (i, obj) {
                    $.each(obj.files, function (j, file) {
                        ajaxData.append('photo[' + iterator + ']', file);
                        iterator++;
                    })
                });
                var progress;
                $.nette.ajax({
                    spinner: false,
                    redirect: false,
                    url: uploadUrl,
                    type: 'POST',
                    async: true,
                    data: ajaxData,
                    dataType: 'json',
                    cache: false,
                    contentType: false,
                    processData: false,
                    xhr: function () {
                        var myXhr = $.ajaxSettings.xhr();
                        if (myXhr.upload) {
                            myXhr.upload.addEventListener('progress', function (e) {
                                if (e.lengthComputable && uploadProgress) {
                                    uploadProgress.setMaximum(e.total);
                                    uploadProgress.setValue(e.loaded);
                                    if (uploadProgress.isSuccess()) {
                                        for (var i in self.onUpload) {
                                            self.onUpload[i].call(self);
                                        }
                                        getStatus();
                                    }
                                }
                            }, false);
                        }
                        return myXhr;
                    },
                    beforeSend: function () {
                        uploadProgress = pipas.progress.show(self.progressContainerId);
                        uploadProgress.setLabel(self.text.upload);
                    },
                    success: function () {
                        if (uploadProgress)uploadProgress.close();
                    },
                    error: function (jqXHR, status, error) {
                        pipas.message.showError("Failed to upload files");
                        if (uploadProgress)uploadProgress.close();
                    }
                });
            }
            else console.log("No file selected");
        };
        this.element = $(elementSelector).off('change', onChange).on('change', onChange);
        /** @type {Array} Callback called after upload */
        this.onUpload = [];
        /** @type {Array} Callback called after processing */
        this.onSuccess = [];
        /** @type {string} url for obtaining processing status */
        this.processingStatusUrl = null;
        /** @type {string} Identifier for progress target (as body element or id selector without grille) */
        this.progressContainerId = "body";
        this.text = {
            upload: "Upload",
            processing: "Processing"
        };
    };

    /**
     *
     * @param fileInputSelector
     * @param uploadUrl
     * @returns {pipas.FileUploadControl}
     */
    pipas.fileUpload = function (fileInputSelector, uploadUrl) {
        return new pipas.FileUploadControl(fileInputSelector, uploadUrl);
    };
})(jQuery, pipas);