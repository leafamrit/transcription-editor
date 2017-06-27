'use strict';

var lock = false;

// to prevent closing window while uploading
window.onbeforeunload = function(e) {
    if(lock) {
        e || window.event;
        if(e) {
            return '';
        }
        return '';
    }
}

// Drag'n'drop
document.addEventListener('DOMContentLoaded', function () {
    var toggleActive = function (e, toggle) {
        e.stopPropagation();
        e.preventDefault();
        toggle ? e.target.classList.add('wavesurfer-dragover') :
        e.target.classList.remove('wavesurfer-dragover');
    };

    var handlers = {
        // Drop event
        drop: function (e) {
            toggleActive(e, false);
            // Load the file into wavesurfer
            if (e.dataTransfer.files.length == 1) {
                lock = true;
                if(/audio/i.test(e.dataTransfer.files[0].type)) {
                    uploadFile(e.dataTransfer.files[0]);
                } else {
                    alert('Please drop a valid audio file.');
                }
            } else {
                alert('Please drop 1 file at a time');
            }
        },

        // Drag-over event
        dragover: function (e) {
            toggleActive(e, true);
        },

        // Drag-leave event
        dragleave: function (e) {
            toggleActive(e, false);
        }
    };

    var dropTarget = document.querySelector('#drop');
    Object.keys(handlers).forEach(function (event) {
        dropTarget.addEventListener(event, handlers[event]);
    });
});

function uploadFile(file) {
    var form = new FormData();
    form.append('audioclip', file);
    var xhttp = new XMLHttpRequest();
    xhttp.onprogress = function(e) {
        var progressDiv = document.getElementById('upload-progress-bar');
        var progressBar = progressDiv.getElementsByClassName('progress-bar')[0];
        progressDiv.style.display = 'block';
        progressBar.style.width = (Math.round(e.loaded / e.total) * 100) + '%';
    }
    xhttp.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200) {
            document.getElementById('audio-uploaded').classList.add('loaded');
            document.getElementById('bt-analyze').removeAttribute('disabled');
            alert('Uploaded Successfully');
        }
    }
    xhttp.open('POST', './save.php');
    xhttp.send(form);
}

function requestTranscript() {
    alert('request received');
}