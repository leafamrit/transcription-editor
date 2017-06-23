'use strict';

var fileURL, transcript;
var audioprocessed = false, transcriptloaded = false, audiouploaded = false;
var metadata = {}
var lock = false;

// Create an instance
var wavesurfer = Object.create(WaveSurfer);

// Init & load audio file
document.addEventListener('DOMContentLoaded', function () {
    var options = {
        container     : document.querySelector('#waveform'),
        loaderColor   : 'purple',
        progressColor: '#f4364c',
        waveColor: '#3f88c5',
        cursorWidth: 2,
        cursorColor: '#3f88c5',
        hideScrollbar: false
    };

    // Init
    wavesurfer.init(options);
});

// Report errors
wavesurfer.on('error', function (err) {
    console.error(err);
});

// Do something when the clip is over
wavesurfer.on('finish', function () {
    console.log('Finished playing');
});

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

/* Progress bar */
document.addEventListener('DOMContentLoaded', function () {
    var progressDiv = document.querySelector('#progress-bar');
    var progressBar = progressDiv.querySelector('.progress-bar');

    var showProgress = function (percent) {
        progressDiv.style.display = 'block';
        progressBar.style.width = percent + '%';
    };

    var hideProgress = function () {
        progressDiv.style.display = 'none';
    };

    wavesurfer.on('loading', showProgress);
    wavesurfer.on('ready', hideProgress);
    wavesurfer.on('destroy', hideProgress);
    wavesurfer.on('error', hideProgress);
});


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
                    wavesurfer.loadBlob(e.dataTransfer.files[0]);
                    wavesurfer.on('ready', function() {
                        audioprocessed = true;
                        document.getElementById('audio-processed').classList.add('loaded');
                    });
                } else if(/json/i.test(e.dataTransfer.files[0].type)) {
                    var reader = new FileReader();
                    reader.readAsText(e.dataTransfer.files[0]);
                    reader.onload = function() {
                        transcript = reader.result;
                        transcript = JSON.parse(transcript);
                        transcript.results[0].results.forEach(function(result, r_i) {
                            result.alternatives.forEach(function(alternative, a_i) {
                                alternative.timestamps.forEach(function(word, w_i) {
                                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][0] += ' ';
                                });
                            });
                        });
                        transcript = JSON.stringify(transcript);
                        document.getElementById('transcript').innerHTML = '<code>' + transcript + '</code>';
                        transcriptloaded = true;
                        document.getElementById('json-loaded').classList.add('loaded');
                        wavesurfer.fireEvent('ready');
                    };
                }
            } else {
                wavesurfer.fireEvent('error', 'Not a file');
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

function getSilences() {
    var silences = {};
    var peaks = wavesurfer.backend.getPeaks(Math.floor(wavesurfer.backend.buffer.length / 100));
    var unit = 0.00002267573 * 100;
    var start, end;
    for(var i = 0; i < peaks.length; i++) {
        if(Math.abs(peaks[i]) < 0.01) {
            start = Number(((unit * i)).toFixed(1));
            while(peaks[i] < 0.01) {i++;}
            end = Number(((unit * i)).toFixed(1));
            if(end > Number((start + 0.2).toFixed(1))) {
                silences[(start - 0.2).toFixed(1)] = Number(end.toFixed(1));
                silences[(start - 0.1).toFixed(1)] = Number(end.toFixed(1));
                silences[start.toFixed(1)] = Number(end.toFixed(1));
                silences[(start + 0.1).toFixed(1)] = Number(end.toFixed(1));
                silences[(start + 0.2).toFixed(1)] = Number(end.toFixed(1));
            }
        }
    }
    return silences;
}

function saveJSON() {
    var xhttp = new XMLHttpRequest();
    var form = new FormData();
    form.append('audioclip', filename);
    xhttp.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200) {
            console.log(this.responseText);
            audioprocessed = false; transcriptloaded = false;
            document.getElementById('bt-analyze').setAttribute('disabled', '');
            alert('Waveform successfully prepared.');
            lock = false;
        } else if(this.readyState === 4 && this.status != 200) {
            alert('Could not save changes, please check your internet connection or try again later.');
        }
    }
    xhttp.open('POST', './save.php', true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send('metadata=' + JSON.stringify(metadata) + '&filename=' + filename + '&transcript=' + transcript);
}

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
            fileURL = this.responseText;
            audiouploaded = true;
            document.getElementById('audio-uploaded').classList.add('loaded');
            wavesurfer.fireEvent('ready');
        }
    }
    xhttp.open('POST', './save.php');
    xhttp.send(form);
}

function getData() {
    metadata = '{ "peaks": [' + wavesurfer.backend.getPeaks(500).toString() + '] }';
    metadata = JSON.parse(metadata);
    metadata.silences = getSilences();
    document.getElementById('filename').innerHTML = '<code>FileURL: ' + fileURL + '</code>';
    document.getElementById('result').setAttribute('style', 'overflow-x: scroll');
    document.getElementById('result').innerHTML = '<code>Metadata:<br/>' + JSON.stringify(metadata) + '</code>';
    document.getElementsByClassName('instructions')[0].setAttribute('style', 'display: block');
    saveJSON();
}

wavesurfer.on('ready', function() {
    if(audioprocessed && transcriptloaded && audiouploaded) {
        document.getElementById('bt-analyze').removeAttribute('disabled');
    }
});
