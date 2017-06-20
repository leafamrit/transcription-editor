var wavesurfer = Object.create(WaveSurfer);

// global variables
var transcript;
var silences = Array();
var highlights = Array();
var strikes = Array();
var pageOptions;

var skipSilences = false;
var playHighlights = false;

var GLOBAL_ACTIONS = {

    'play': function() {
        togglePlayPause();
        wavesurfer.playPause();
    },

    'stop': function() {
        togglePlayPause();
        wavesurfer.stop();
        readWords();
    },

    'rewind': function() {
        wavesurfer.skipBackward(5);
    },

    'speedx05': function() {
        wavesurfer.setPlaybackRate(0.5);
        activeSpeed();
    },

    'speedx1': function() {
        wavesurfer.setPlaybackRate(1);
        activeSpeed();
    },

    'speedx125': function() {
        wavesurfer.setPlaybackRate(1.25);
        activeSpeed();
    },

    'speedx15': function() {
        wavesurfer.setPlaybackRate(1.5);
        activeSpeed();
    },

    'speedx175': function() {
        wavesurfer.setPlaybackRate(1.75);
        activeSpeed();
    },

    'speedx2': function() {
        wavesurfer.setPlaybackRate(2);
        activeSpeed();
    },

    'skipsilence': function() {
        skipSilences = !skipSilences;
    },

    'playhighlight': function() {
        if(!playHighlights) {
            getHighlights();
            wavesurfer.seekTo(highlights[0] / wavesurfer.getDuration());
        }
        playHighlights = !playHighlights;
    },

    'toggle-hints': function() {
        var hintSwitch = document.getElementById('hints-switch');
        hintSwitch.classList.toggle('off');
        document.getElementById('hints').classList.toggle('hidden');
        if(/off/i.test(hintSwitch.classList.toString())) {
            hintSwitch.innerHTML = 'Turn Hints On';
            setCookie('hints', 'off');
        } else {
            hintSwitch.innerHTML = 'Turn Hints Off';
            setCookie('hints', 'on');
        }
    },

    'toggle-help': function() {
        var helpSwitch = document.getElementById('help-switch');
        helpSwitch.classList.toggle('off');
        if(/off/i.test(helpSwitch.classList.toString())) {
            helpSwitch.innerHTML = 'Show at Startup';
            setCookie('help', 'off');
        } else {
            helpSwitch.innerHTML = 'Don\'t Show at Startup';
            setCookie('help', 'on');
        }
    },

    'close-export': function() {
        document.getElementById('export-wrapper').classList.add('invisible');
        setTimeout(function() {
            document.getElementById('export-wrapper').classList.add('hidden');
        }, 50);
    },

    'close-help': function() {
        document.getElementById('help-wrapper').classList.add('invisible');
        setTimeout(function() {
            document.getElementById('help-wrapper').classList.add('hidden');
        }, 50);
    },

    'export-srt': function() {
        var results = transcript.results[0].results;
        var speakers = transcript.results[0].speaker_labels;
        var counter = 1;
        var i = 0;
        var srt = Array();
        var currentSpeaker, prevSpeaker;
        var sentence;
        var onlyHighlight = document.getElementById('export-highlight').checked;

        results.forEach(function(result, resultIndex) {
            var maxConfidence = 0;
            var maxAlternative;
            result.alternatives.forEach(function(alternative, alternativeIndex) {
                if(alternative.confidence > maxConfidence) {
                    maxAlternative = alternative;
                    maxAlternativeIndex = alternativeIndex;
                }
            });
            sentence = '';
            maxAlternative.timestamps.forEach(function(word, wordIndex) {
                currentSpeaker = speakers[i++].speaker;
                if(onlyHighlight) {
                    if(word[3]) {
                        if(!word[3].strike && word[3].highlight) {
                            if(currentSpeaker != prevSpeaker) {
                                sentence += '(' + currentSpeaker + ')';
                            }
                            sentence += '<b>' + word[0] + '</b>';
                        }
                    }
                } else {
                    if(currentSpeaker != prevSpeaker) {
                        sentence += '(' + currentSpeaker + ') ';
                    }
                    if(word[3]) {
                        if(!word[3].strike) {
                            if(word[3].highlight) {
                                sentence += '<b>' + word[0] + '</b>';
                            } else {
                                sentence += word[0];
                            }
                        }
                    } else {
                        sentence += word[0];
                    }
                }
                prevSpeaker = currentSpeaker;
            });
            if(sentence.trim() != '') {
                srt.push((counter++) + '\n');
                srt.push(toHHMMssmmm(maxAlternative.timestamps[0][1]) + ' --> ' + toHHMMssmmm(maxAlternative.timestamps[maxAlternative.timestamps.length - 1][2]) + '\n');
                srt.push(sentence + '\n\n');
            }
        });

        var blob = new Blob(srt, {type: 'text/srt'});
        saveAs(blob, 'transcript.srt');

        GLOBAL_ACTIONS['close-export']();
    },

    'export-vtt': function() {
        var results = transcript.results[0].results;
        var speakers = transcript.results[0].speaker_labels;
        var counter = 1;
        var i = 0;
        var vtt = Array();
        var currentSpeaker, prevSpeaker;
        var sentence;
        var onlyHighlight = document.getElementById('export-highlight').checked;

        vtt.push('WEBVTT\n\n');

        results.forEach(function(result, resultIndex) {
            var maxConfidence = 0;
            var maxAlternative;
            result.alternatives.forEach(function(alternative, alternativeIndex) {
                if(alternative.confidence > maxConfidence) {
                    maxAlternative = alternative;
                    maxAlternativeIndex = alternativeIndex;
                }
            });
            sentence = '';
            maxAlternative.timestamps.forEach(function(word, wordIndex) {
                currentSpeaker = speakers[i++].speaker;
                if(onlyHighlight) {
                    if(word[3]) {
                        if(!word[3].strike && word[3].highlight) {
                            if(currentSpeaker != prevSpeaker) {
                                sentence += '(' + currentSpeaker + ') ';
                            }
                            sentence += '<b>' + word[0] + '</b>';
                        }
                    }
                } else {
                    if(currentSpeaker != prevSpeaker) {
                        sentence += '(' + currentSpeaker + ') ';
                    }
                    if(word[3]) {
                        if(!word[3].strike) {
                            if(word[3].highlight) {
                                sentence += '<b>' + word[0] + '</b>';
                            } else {
                                sentence += word[0];
                            }
                        }
                    } else {
                        sentence += word[0];
                    }
                }
                prevSpeaker = currentSpeaker;
            });
            if(sentence.trim() != '') {
                vtt.push((counter++) + '\n');
                vtt.push(toHHMMssmmm(maxAlternative.timestamps[0][1]).replace(',', '.') + ' --> ' + toHHMMssmmm(maxAlternative.timestamps[maxAlternative.timestamps.length - 1][2]).replace(',', '.') + '\n');
                vtt.push(sentence + '\n\n');
            }
        });

        var blob = new Blob(vtt, {type: 'text/vtt'});
        saveAs(blob, 'transcript.vtt');

        GLOBAL_ACTIONS['close-export']();
    },

    'export-pdf': function() {
        var results = transcript.results[0].results;
        var speakers = transcript.results[0].speaker_labels;
        var words = Array();
        var currentSpeaker, nextSpeaker;
        var sentence = '';
        var onlyHighlight = document.getElementById('export-highlight').checked;
        var noTimestamps = document.getElementById('no-timestamps').checked;

        results.forEach(function(result, resultIndex) {
            var maxConfidence = 0;
            var maxAlternative;
            result.alternatives.forEach(function(alternative, alternativeIndex) {
                if(alternative.confidence > maxConfidence) {
                    maxAlternative = alternative;
                    maxAlternativeIndex = alternativeIndex;
                }
            });
            maxAlternative.timestamps.forEach(function(word, wordIndex) {
                words.push(word);
            });
        });

        for(var i = 0; i < words.length - 1;) {
            currentSpeaker = speakers[i].speaker;
            nextSpeaker = speakers[i + 1].speaker;
            if(onlyHighlight){
                var currentPara = currentSpeaker + ': ';
                if(!noTimestamps) { currentPara += '[' + toHHMMssmmm(words[i][1]).replace(',', '.') + ']'; }
            } else {
                sentence += currentSpeaker + ': ';
                if(!noTimestamps) { sentence += '[' + toHHMMssmmm(words[i][1]).replace(',', '.') + '] '; }
            }
            do {
                try {
                    nextSpeaker = speakers[i + 1].speaker;
                } catch(exception) {
                    nextSpeaker = null;
                }
                if(onlyHighlight) {
                    if(words[i][3]) {
                        if(!words[i][3].strike) {
                            if(words[i][3].highlight) {
                                sentence += currentPara;
                                currentPara = '';
                                sentence += words[i][0];
                            }
                        }
                    }
                } else {
                    if(words[i][3]) {
                        if(!words[i][3].strike) {
                            if(words[i][3].highlight) {
                                sentence += words[i][0];
                            } else {
                                sentence += words[i][0];
                            }
                        }
                    } else {
                        sentence += words[i][0];
                    }
                }
                i++;
            } while(currentSpeaker == nextSpeaker && i < words.length);
            if(onlyHighlight && currentPara == '') {
                if(!noTimestamps) { sentence += '[' + toHHMMssmmm(words[i - 1][2]).replace(',', '.') + ']'; }
                sentence += '\n\n';
            } else if(!onlyHighlight && !currentPara) {
                if(!noTimestamps) { sentence += '[' + toHHMMssmmm(words[i - 1][2]).replace(',', '.') + ']'; }
                sentence += '\n\n';
            }
        }

        var pdf = new jsPDF();
        pdf.setFontSize(10);
        var splitSentence = pdf.splitTextToSize(sentence, 160);
        while(splitSentence.length > 0) {
            pdf.text(splitSentence.splice(0, 70), 10, 10);
            pdf.addPage();
        }
        pdf.save('transcript.pdf');

        GLOBAL_ACTIONS['close-export']();
    },

    'export-doc': function() {
        var results = transcript.results[0].results;
        var speakers = transcript.results[0].speaker_labels;
        var words = Array();
        var currentSpeaker, nextSpeaker;
        var sentence = '';
        var onlyHighlight = document.getElementById('export-highlight').checked;
        var noTimestamps = document.getElementById('no-timestamps').checked;

        results.forEach(function(result, resultIndex) {
            var maxConfidence = 0;
            var maxAlternative;
            result.alternatives.forEach(function(alternative, alternativeIndex) {
                if(alternative.confidence > maxConfidence) {
                    maxAlternative = alternative;
                    maxAlternativeIndex = alternativeIndex;
                }
            });
            maxAlternative.timestamps.forEach(function(word, wordIndex) {
                words.push(word);
            });
        });

        for(var i = 0; i < words.length - 1;) {
            currentSpeaker = speakers[i].speaker;
            nextSpeaker = speakers[i + 1].speaker;
            if(onlyHighlight){
                var currentPara = '<w:p><w:r><w:t>' + currentSpeaker + ': ';
                if(!noTimestamps) { currentPara += '[' + toHHMMssmmm(words[i][1]).replace(',', '.') + ']'; }
                currentPara += ' </w:t></w:r>';
            } else {
                sentence += '<w:p><w:r><w:t>' + currentSpeaker + ': ';
                if(!noTimestamps) { sentence += '[' + toHHMMssmmm(words[i][1]).replace(',', '.') + ']'; }
                sentence += ' </w:t></w:r>';
            }
            do {
                try {
                    nextSpeaker = speakers[i + 1].speaker;
                } catch(exception) {
                    nextSpeaker = null;
                }
                if(onlyHighlight) {
                    if(words[i][3]) {
                        if(!words[i][3].strike) {
                            if(words[i][3].highlight) {
                                sentence += currentPara;
                                currentPara = '';
                                sentence += '<w:r><w:rPr><w:highlight w:val="yellow" /></w:rPr><w:t>' + words[i][0] + '</w:t></w:r>';
                            }
                        }
                    }
                } else {
                    if(words[i][3]) {
                        if(!words[i][3].strike) {
                            if(words[i][3].highlight) {
                                sentence += '<w:r><w:rPr><w:highlight w:val="yellow" /></w:rPr><w:t>' + words[i][0] + '</w:t></w:r>';
                            } else {
                                sentence += '<w:r><w:t>' + words[i][0] + '</w:t></w:r>';
                            }
                        }
                    } else {
                        sentence += '<w:r><w:t>' + words[i][0] + '</w:t></w:r>';
                    }
                }
                i++;
            } while(currentSpeaker == nextSpeaker && i < words.length);
            if(onlyHighlight && currentPara == '') {
                sentence += '<w:r><w:t> ';
                if(!noTimestamps) { sentence += '[' + toHHMMssmmm(words[i - 1][2]).replace(',', '.') + ']'; }
                sentence += '\n\n</w:t></w:r></w:p>';
            } else if(!onlyHighlight && !currentPara) {
                sentence += '<w:r><w:t> ';
                if(!noTimestamps) { sentence += '[' + toHHMMssmmm(words[i - 1][2]).replace(',', '.') + ']'; }
                sentence += '\n\n</w:t></w:r></w:p>';
            }
        }

        function loadFile(url, callback){
            JSZipUtils.getBinaryContent(url, callback);
        }

        loadFile("./src/template.docx", function(error, content){
            if (error) { throw error };
            var zip = new JSZip(content);
            var doc = new Docxtemplater().loadZip(zip)
            doc.setData({ xml: sentence });

            try {
                doc.render()
            } catch (error) {
                var e = {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    properties: error.properties,
                }
                console.log(JSON.stringify( { error: e} ));
                throw error;
            }

            var out = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            saveAs(out,"transcript.docx");
        });

        GLOBAL_ACTIONS['close-export']();
    }
}

// set cookies for showing / hiding of hints
function setCookie(key, value) {
    var d = new Date();
    d.setTime(d.getTime() + 2592000000);
    document.cookie = key + '=' + value + '; expires=' + d.toUTCString() + '; path=/';
}

// convert seconds to  string of format HH:MM:ss,mmm
function toHHMMssmmm(seconds) {
    var milliseconds = parseInt(seconds * 1000, 10);
    var hr = Math.floor(milliseconds / 3600000);
    milliseconds %= 3600000;
    var min = Math.floor(milliseconds / 60000);
    milliseconds %= 60000;
    var sec = Math.floor(milliseconds / 1000);
    milliseconds %= 1000;
    if( hr < 10 ) { hr = '0' + hr; }
    if( min < 10 ) { min = '0' + min; }
    if( sec < 10 ) { sec = '0' + sec; }
    if( milliseconds < 100 ) {
        if( milliseconds < 10 ) {
            milliseconds = '00' + milliseconds;
        } else {
            milliseconds = '0' + milliseconds;
        }
    }
    return hr + ':' + min + ':' + sec + ',' + milliseconds;
}

// change play pause icon
function togglePlayPause() {
    document.getElementById('playpause').classList.toggle('fa-play');
    document.getElementById('playpause').classList.toggle('fa-pause');
}

// add color to active playback speed
function activeSpeed() {
    var map = {
        0.5: 0,
        1: 1,
        1.25: 2,
        1.5: 3,
        1.75: 4,
        2: 5
    }
    var speedButtons = document.querySelectorAll('.speed');
    [].forEach.call(speedButtons, function(el) {
        el.classList.remove('activespeed');
    });
    speedButtons[map[wavesurfer.backend.playbackRate]].classList.add('activespeed');
}

// load JSON
function loadJSON(filepath, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200) {
            callback(this.responseText);
        }
    }
    xhttp.open('GET', filepath, true);
    xhttp.send();
}

// generate highlight array
function getHighlights() {
    var keys = Array();

    // get highlighted starts and ends
    [].forEach.call(document.getElementsByClassName('highlight'), function(el) {
        keys.push({
            start: Number(el.getAttribute('starttime')),
            end: Number(el.getAttribute('endtime'))
        });
    });

    // clear array to remove garbage data
    highlights = [];

    // generate highlight array
    if(keys.length > 0) {
        highlights['0'] = Number((keys[0].start).toFixed(1));
        for(var i = 0; i < keys.length - 1; i++) {
            if(Number(keys[i + 1].start.toFixed(1)) > Number(keys[i].end + 0.2).toFixed(1)) {
                // give a 0.5 second window to compare and skip
                highlights[(keys[i].end - 0.2).toFixed(1)] = Number(keys[i + 1].start.toFixed(1));
                highlights[(keys[i].end - 0.1).toFixed(1)] = Number(keys[i + 1].start.toFixed(1));
                highlights[(keys[i].end).toFixed(1)] = Number(keys[i + 1].start.toFixed(1));
                highlights[(keys[i].end + 0.1).toFixed(1)] = Number(keys[i + 1].start.toFixed(1));
                highlights[(keys[i].end + 0.2).toFixed(1)] = Number(keys[i + 1].start.toFixed(1));
            }
        }
        if(keys.length > 1) {
            highlights[(keys[i].end - 0.2).toFixed(1)] = highlights['0'];
            highlights[(keys[i].end - 0.1).toFixed(1)] = highlights['0'];
            highlights[keys[i].end.toFixed(1)] = highlights['0'];
            highlights[(keys[i].end + 0.1).toFixed(1)] = highlights['0'];
            highlights[(keys[i].end + 0.2).toFixed(1)] = highlights['0'];
        }
    }
}

function getStrikes() {
    var keys = Array();

    // get striked starts and ends
    [].forEach.call(document.getElementsByClassName('strike'), function(el) {
        keys.push({
            start: Number(el.getAttribute('starttime')),
            end: Number(el.getAttribute('endtime'))
        });
    });

    // clear array to remove garbage
    strikes = [];

    // generate array
    var start, end;
    for(var i = 0; i < keys.length; i++) {
        start = keys[i].start.toFixed(1);
        while(i < keys.length - 1 && keys[i].end.toFixed(1) === keys[i + 1].start.toFixed(1)) { i++; }
        end = Number(keys[i].end.toFixed(1));
        if(end > (Number(start) + 0.2)) {
            // 0.5 second window
            strikes[(Number(start) - 0.2).toFixed(1)] = end;
            strikes[(Number(start) - 0.1).toFixed(1)] = end;
            strikes[start] = end;
            strikes[(Number(start) + 0.1).toFixed(1)] = end;
            strikes[(Number(start) + 0.2).toFixed(1)] = end;
        }
    }
}

function showExport(event) {
    var ele = document.getElementById('export-wrapper');
    ele.setAttribute('style', 'top: ' + event.clientY + 'px; left: ' + event.clientX + 'px;');
    ele.classList.remove('hidden');
    setTimeout(function() {
        ele.classList.remove('invisible');
    }, 50);
}

function showHelp(event) {
    var ele = document.getElementById('help-wrapper');
    ele.classList.remove('hidden');
    setTimeout(function() {
        ele.classList.remove('invisible');
    }, 50);
}

function enableUI() {
    document.getElementById('loader').classList.toggle('spinning');
    document.getElementById('main-container-mask').classList.toggle('invisible');
    setTimeout(function() {
        document.getElementById('main-container-mask').setAttribute('style', 'display: none');
    }, 30);
}

function seekToWord(caller) {
    wavesurfer.seekTo(caller.id / wavesurfer.getDuration());
}

function resizeBody() {
    var off = document.getElementsByClassName('main-container')[0].offsetHeight;
    var height = window.innerHeight - off;
    document.getElementsByClassName('transcript-container')[0].setAttribute('style', 'height: ' + height + 'px');
    document.getElementById('text-options').setAttribute('style', 'margin-top: ' + off + 'px');
}

// fill editor with words from transcript
function fillWords() {
    var results = transcript.results[0].results;
    var speakers = transcript.results[0].speaker_labels;
    var words = Array();
    var toReach = Array();
    var maxAlternativeIndex;
    var i = 0;
    var globalspkr_i = 0;

    var textArea = document.getElementById('transcript-area');

    // clear the div before adding content (helpful when undo / redo refreshes content)
    while(textArea.hasChildNodes()) {
        textArea.removeChild(textArea.lastChild);
    }

    // for each result
    results.forEach(function(result, resultIndex) {
        var maxConfidence = 0;
        var maxAlternative;

        // find chunk with maximum confidence
        result.alternatives.forEach(function(alternative, alternativeIndex) {
            if(alternative.confidence > maxConfidence) {
                maxAlternative = alternative;
                maxAlternativeIndex = alternativeIndex;
            }
        });

        // for each word in the chunk
        var currentSpeaker, prevSpeaker, div, speakerName, currWord;
        maxAlternative.timestamps.forEach(function(word, wordIndex) {

            currentSpeaker = speakers[i++].speaker;

            if(currentSpeaker != prevSpeaker) {
                // if speaker changes within a chunk
                if(div) {
                    textArea.appendChild(div);
                    var specialBreak = document.createElement('br');
                    specialBreak.classList.add('special-break');
                    textArea.appendChild(specialBreak);
                }

                // start creating div for surrent speaker
                div = document.createElement('div');
                div.setAttribute('title', currentSpeaker);
                div.classList.add('speaker-div');

                // input field for speaker name
                speakerName = document.createElement('input');
                speakerName.value = currentSpeaker;
                speakerName.id = 'speaker' + (i - 1);
                speakerName.classList.add('speaker');
                speakerName.setAttribute('readonly', '');
                speakerName.setAttribute('name', 'speaker');
                speakerName.setAttribute('speakername', currentSpeaker);
                speakerName.setAttribute('speakerindex', (i - 1));
                speakerName.setAttribute('style', 'width: ' + ((speakerName.value.length * 8) + 20) + 'px');
                textArea.appendChild(speakerName);
            }

            // start creating span for current word if word is not blank
            if(word[0].trim() != '') {
                currWord = document.createElement('span');
                currWord.innerHTML = word[0];
                currWord.setAttribute('starttime', word[1]);
                currWord.setAttribute('endtime', word[2]);
                currWord.setAttribute('resultindex', resultIndex);
                currWord.setAttribute('alternativeindex', maxAlternativeIndex);
                currWord.setAttribute('wordindex', wordIndex);
                currWord.setAttribute('speakerindex', globalspkr_i);
                currWord.setAttribute('title', word[1] + " - " + word[2]);
                currWord.setAttribute('tabindex', '-1');
                currWord.addEventListener('focus', function() { seekToWord(this); });
                currWord.id = word[1];
                currWord.classList.add('word');
            }
            globalspkr_i++;

            // check if word highlighted or striked
            var hWaveId = 'h' + word[1];
            var sWaveId = 's' + word[1];
            if(word[3]) {
                if(word[3].highlight) {
                    // add highlighting to text
                    currWord.classList.add('highlight');

                    // check if highlighted region already present in waveform (helpful on undo / redo)
                    if(!(hWaveId in wavesurfer.regions.list)) {
                        // create highlighted region
                        wavesurfer.addRegion({
                            id: hWaveId,
                            start: currWord.getAttribute('starttime'),
                            end: currWord.getAttribute('endtime'),
                            color: 'rgba(255, 255, 0, 0.3)',
                            drag: false,
                            resize: false
                        });
                    }
                } else if(word[3].strike) {
                    // add strike to text
                    currWord.classList.add('strike');

                    // check if striked region already present in waveform (helpful on undo / redo)
                    if(!(sWaveId in wavesurfer.regions.list)) {
                        // create striked region
                        wavesurfer.addRegion({
                            id: sWaveId,
                            start: currWord.getAttribute('starttime'),
                            end: currWord.getAttribute('endtime'),
                            color: 'rgba(100, 100, 100, 0.5)',
                            drag: false,
                            resize: false
                        });
                    }
                } else {
                    // remove highlight if present
                    if(hWaveId in wavesurfer.regions.list) {
                        wavesurfer.regions.list[hWaveId].remove();
                    }
                    // remove strike region if present
                    if(sWaveId in wavesurfer.regions.list) {
                        wavesurfer.regions.list[sWaveId].remove();
                    }
                }
            } else {
                // remove highlight if present
                if(hWaveId in wavesurfer.regions.list) {
                    wavesurfer.regions.list[hWaveId].remove();
                }
                // remove strike region if present
                if(sWaveId in wavesurfer.regions.list) {
                    wavesurfer.regions.list[sWaveId].remove();
                }
            }

            // add current word to speaker
            div.appendChild(currWord);

            // go to next speaker
            prevSpeaker = currentSpeaker;
        });

        // add speaker to editor
        textArea.appendChild(div);

        // add small space between two speakers
        var specialBreak = document.createElement('br');
        specialBreak.classList.add('special-break');
        textArea.appendChild(specialBreak);
    });

    // get highlights and strike arrays for skipping playback
    getHighlights();
    getStrikes();
}

function readWords() {
    readWord = document.getElementsByClassName('read');
    try {
        currWord = readWord[0] ? (readWord[readWord.length - 1].nextSibling ? readWord[readWord.length - 1].nextSibling : readWord[readWord.length - 1].parentElement.nextSibling.nextSibling.nextSibling.firstChild) : document.getElementsByClassName('word')[0];
    } catch (exception) {
        currWord = document.getElementsByClassName('word')[0];
    }

    var divEnds = document.getElementById('transcript-area').getBoundingClientRect();

    if(currWord.id < wavesurfer.getCurrentTime()) {
        while(currWord && currWord.id < wavesurfer.getCurrentTime()) {
            currWord.classList.add('read');
            currWord = currWord.nextSibling ? currWord.nextSibling : currWord.parentElement.nextSibling.nextSibling.nextSibling.firstChild;
        }
        if(divEnds.bottom < currWord.getBoundingClientRect().bottom || divEnds.top > currWord.getBoundingClientRect().top) {
            currWord.scrollIntoView();
        }
        if(divEnds.top + 150 < currWord.getBoundingClientRect().top) {
            var goDown = setInterval(scrollStep, 10);
            function scrollStep() {
                if(divEnds.top + 150 >= currWord.getBoundingClientRect().top) {
                    clearInterval(goDown);
                } else {
                    document.getElementById('transcript-area').scrollTop += 5;
                }
            }
        }

    } else {
        [].forEach.call(document.querySelectorAll('.read'), function(el) {
            if(el.id > wavesurfer.getCurrentTime()) {
                el.classList.remove('read');
            }
        });

        readWord = document.getElementsByClassName('read');
        currWord = readWord[readWord.length - 1];
        if(currWord) {
            if(divEnds.bottom < currWord.getBoundingClientRect().bottom || divEnds.top > currWord.getBoundingClientRect().top) {
                currWord.scrollIntoView();
            }
            if(divEnds.top + 100 > currWord.getBoundingClientRect().top) {
                var goUp = setInterval(scrollStep, 10);
                function scrollStep() {
                    if(divEnds.top + 100 <= currWord.getBoundingClientRect().top) {
                        clearInterval(goUp);
                    } else {
                        document.getElementById('transcript-area').scrollTop -= 5;
                    }
                }
            }
        }
    }
}

function checkDeepLink(getVars) {
    if('t' in getVars) {
        var time = 0;
        if(getVars.t.split('h').length > 1) {
            time += Number(getVars.t.split('h')[0]) * 3600;
            getVars.t = getVars.t.split('h')[1];
        }
        if(getVars.t.split('m').length > 1) {
            time += Number(getVars.t.split('m')[0]) * 60;
            getVars.t = getVars.t.split('m')[1];
        }
        if(getVars.t.split('s').length > 1) {
            time += Number(getVars.t.split('s')[0]);
            getVars.t = getVars.t.split('s')[1];
        }
        var ratio = time / wavesurfer.getDuration();
        if(ratio <= 1) {
            wavesurfer.seekTo(ratio);
        }
    }
}

function getParameters() {
    var getVars = {};
    window.location.search.slice(1).split('&').forEach(function(getVar) {
        var temp = getVar.split('=');
        getVars[temp[0]] = temp[1];
    });
    return getVars;
}

function getURLs(id) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200) {
            pageOptions = JSON.parse(this.responseText);
            init();
        }
    }
    xhttp.open('POST', './save.php', true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send('id=' + id);
}

function updateTime() {
    var currTime = wavesurfer.getCurrentTime();
    var totalTime = wavesurfer.getDuration();
    var currDisplayTime = toHHMMssmmm(currTime).split(',')[0];
    var remDisplayTime = toHHMMssmmm(totalTime - currTime).split(',')[0];
    document.getElementById('elapsed-time').innerText = currDisplayTime;
    document.getElementsByTagName('wave')[0].title = currDisplayTime;
    document.getElementById('remaining-time').innerText = remDisplayTime;
}

// Initialization
var getParams = getParameters();
//if('id' in getParams) {              // UNCOMMENT WHEN DEPLOYED
    //getURLs(getParams['id']);        // UNCOMMENT WHEN DEPLOYED
    pageOptions = {                                                 // COMMENT WHEN DEPLOYED
        metaURL: 'transcript/new-york-rock_meta.json',              // COMMENT WHEN DEPLOYED
        transcriptURL: 'transcript/new-york-rock_prepared.json',    // COMMENT WHEN DEPLOYED
        audioURL: 'audio/new-york-rock.mp3'                         // COMMENT WHEN DEPLOYED
    };                                                              // COMMENT WHEN DEPLOYED
    init();                                                         // COMMENT WHEN DEPLOYED
//}                                    // UNCOMMENT WHEN DEPLOYED

function init() {
    document.addEventListener('DOMContentLoaded', function() {
        // cookies
        if(/hints=off/i.test(document.cookie)) {
            GLOBAL_ACTIONS['toggle-hints']();
        }
        if(/help=off/i.test(document.cookie)) {
            GLOBAL_ACTIONS['toggle-help']();
            GLOBAL_ACTIONS['close-help']();
        }

        // wavesurfer options
        var options = {
            container: document.querySelector('#audioclip'),
            progressColor: '#f4364c',
            waveColor: '#3f88c5',
            cursorWidth: 2,
            cursorColor: '#3f88c5',
            barWidth: 2,
            normalize: true,
            backend: 'MediaElement',
            height: 95
        };

        // initialize wavesurfer with options
        wavesurfer.init(options);

        // load metadata and audio
        loadJSON(pageOptions.metaURL, function(text) {
            var metadata = JSON.parse(text);
            silences = metadata.silences;
            wavesurfer.load(pageOptions.audioURL, metadata.peaks, 'none');
        });

        // handle events while playing
        wavesurfer.on('audioprocess', function() {
            curr = wavesurfer.getCurrentTime().toFixed(1);
            readWords();
            updateTime();

            if( curr in strikes ) {
                wavesurfer.backend.seekTo(strikes[curr]);
            }

            if(playHighlights) {
                if( curr in highlights ) {
                    wavesurfer.backend.seekTo(highlights[curr]);
                }
            }

            if(skipSilences) {
                if( curr in silences ) {
                    wavesurfer.backend.seekTo(silences[curr]);
                }
            }
        });

        wavesurfer.on('finish', function() {
            GLOBAL_ACTIONS['stop']();
        });

        wavesurfer.on('seek', function() {
            readWords();
            updateTime();
        });

        // startup the page
        wavesurfer.on('ready', function() {
            var timeline = Object.create(WaveSurfer.Timeline);

            var timeGap = (Math.floor(wavesurfer.getDuration() / 1000) * 100) / 2;
            timeline.init({
                wavesurfer: wavesurfer,
                container: '#audioclip-timeline',
                primaryColor: '#3f88c5',
                seondaryColor: '#f4364c',
                primaryFontColor: '#f6f7eb',
                secondaryFontColor: '#f6f7eb',
                timeInterval: timeGap,
                height: 15
            });

            updateTime();

            wavesurfer.addRegion({
                id: 'dummy',
                start: 0,
                end: 0,
                drag: false,
                resize: false,
                color: 'rgba(255, 255, 0, 0)'
            });

            resizeBody();
            enableUI();

            activeSpeed();

            loadJSON(pageOptions.transcriptURL, function(text) {
                transcript = JSON.parse(text);
                fillWords();
                checkDeepLink(getParams);
            });
        });
    });


    // Event handlers
    document.addEventListener('DOMContentLoaded', function() {
        // buttons
        [].forEach.call(document.querySelectorAll('[data-action]'), function(el) {
            el.addEventListener('click', function(e) {
                var action = e.currentTarget.dataset.action;
                if(action in GLOBAL_ACTIONS) {
                    e.preventDefault();
                    GLOBAL_ACTIONS[action]();
                }
            });
        });

        // volume
        document.getElementById('volumerange').addEventListener('change', function() {
            //document.getElementById('volume').innerHTML = this.value;
            wavesurfer.setVolume(this.value / 100);
        });

        // keypresses
        var shortcutWrapper = document.getElementById('shortcut-wrapper');
        var shift_key = document.getElementById('shift-key');
        var space_key = document.getElementById('space-key');
        var extra_key = document.getElementById('extra-key');
        document.addEventListener('keydown', function(e) {
            var map = {
                32: 'play',         // space
                82: 'rewind'        // R
            }
            if(e.ctrlKey) {
                shortcutWrapper.classList.remove('hidden');
                var action = map[e.keyCode];
                if(action in GLOBAL_ACTIONS) {
                    e.preventDefault();
                    if(e.keyCode == 32) {
                        space_key.classList.remove('hidden');
                    } else {
                        extra_key.innerHTML = e.key.toUpperCase();
                        extra_key.classList.remove('hidden');
                    }
                    GLOBAL_ACTIONS[action]();
                }
            }
        });

        document.addEventListener('keyup', function(e) {
            if(!/hidden/i.test(shortcutWrapper.classList.toString())) {
                shortcutWrapper.classList.add('hidden');
            }
            if(!/hidden/i.test(extra_key.classList.toString())) {
                extra_key.classList.add('hidden');
            }
            if(!/hidden/i.test(space_key.classList.toString())) {
                space_key.classList.add('hidden');
            }
        });
    });
}
