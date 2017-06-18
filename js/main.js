var wavesurfer = Object.create(WaveSurfer);

// global variables
var transcript;
var silences = Array();
var highlights = Array();
var strikes = Array();
var pastStack = Array();
var futureStack = Array();
var globaluksp = 0;
var changed = false;

var skipSilences = false;
var playHighlights = false;

var undoAction = false;

// mutation observers
var wordObserver;
var nodeObserver;

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

    'save': function() {
        saveJSON(true);
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
                var currentPara = currentSpeaker + ': [' + toHHMMssmmm(words[i][1]).replace(',', '.') + '] ';
            } else {
                sentence += currentSpeaker + ': [' + toHHMMssmmm(words[i][1]).replace(',', '.') + '] ';
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
                sentence += '[' + toHHMMssmmm(words[i - 1][2]).replace(',', '.') + ']\n\n';
            } else if(!onlyHighlight && !currentPara) {
                sentence += '[' + toHHMMssmmm(words[i - 1][2]).replace(',', '.') + ']\n\n';
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
                var currentPara = '<w:p><w:r><w:t>' + currentSpeaker + ': [' + toHHMMssmmm(words[i][1]).replace(',', '.') + '] </w:t></w:r>';
            } else {
                sentence += '<w:p><w:r><w:t>' + currentSpeaker + ': [' + toHHMMssmmm(words[i][1]).replace(',', '.') + '] </w:t></w:r>';
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
                                sentence += '<w:r><w:t>' + words[i][0] + '</w:t></w:r>';
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
                sentence += '<w:r><w:t> [' + toHHMMssmmm(words[i - 1][2]).replace(',', '.') + ']\n\n</w:t></w:r></w:p>';
            } else if(!onlyHighlight && !currentPara) {
                sentence += '<w:r><w:t> [' + toHHMMssmmm(words[i - 1][2]).replace(',', '.') + ']\n\n</w:t></w:r></w:p>';
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
    },

    'close-find-replace': function() {
        document.getElementById('export-wrapper').classList.add('invisible');
        setTimeout(function() {
            document.getElementById('find-replace-wrapper').classList.add('hidden');
        }, 50);
        [].forEach.call(document.querySelectorAll('.found'), function(el) {
            el.classList.remove('found');
        });
    },

    'strike': function() {
        pastStack.push(JSON.stringify(transcript));
        if(window.getSelection && window.getSelection().toString().split('').length > 1) {
            var startElement = window.getSelection().anchorNode.parentElement;
            if(startElement.classList[0] != 'word') {
                startElement = startElement.nextSibling;
            }
            var endElement = window.getSelection().focusNode.parentElement;
            if(endElement.classList[0] != 'word') {
                endElement = endElement.nextSibling;
            }
            if(Number(startElement.id) > Number(endElement.id)) {
                var temp = startElement;
                startElement = endElement;
                endElement = temp;
            }
            var currentNode = document.getElementById(startElement.id);
            while(Number(currentNode.id) <= Number(endElement.id)) {
                currentNode.classList.toggle('strike');
                if(/highlight/i.test(currentNode.classList.toString())) {
                    currentNode.classList.remove('highlight');
                }
                sWaveId = 's' + currentNode.id;
                hWaveId = 'h' + currentNode.id;
                if(sWaveId in wavesurfer.regions.list) {
                    wavesurfer.regions.list[sWaveId].remove();
                } else {
                    if(hWaveId in wavesurfer.regions.list) {
                        wavesurfer.regions.list[hWaveId].remove();
                    }
                    wavesurfer.addRegion({
                        id: sWaveId,
                        start: currentNode.getAttribute('starttime'),
                        end: currentNode.getAttribute('endtime'),
                        color: 'rgba(100, 100, 100, 0.5)',
                        drag: false,
                        resize: false
                    });
                }

                var r_i = currentNode.getAttribute('resultindex');
                var a_i = currentNode.getAttribute('alternativeindex');
                var w_i = currentNode.getAttribute('wordindex');
                
                if(transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3]) {
                    if(transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike) {
                        transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
                    } else {
                        transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
                        transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
                    }
                } else {
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
                }

                if(currentNode.nextSibling) {
                    currentNode = currentNode.nextSibling;
                } else {
                    break;
                }
            }
        } else {
            var readEle = document.getElementsByClassName('read');
            
            if(readEle.length <= 0) {
                currentNode = document.getElementsByClassName('word')[0];
            } else if(readEle[readEle.length - 1].nextSibling) {
                currentNode = readEle[readEle.length - 1].nextSibling;
            } else if (readEle[readEle.length - 1].parentNode.nextSibling.nextSibling.nextSibling) {
                currentNode = readEle[readEle.length - 1].parentNode.nextSibling.nextSibling.nextSibling.firstChild;
            } else {
                currentNode = readEle[readEle.length - 1];
            }
            currentNode.classList.toggle('strike');
            if(/highlight/i.test(currentNode.classList.toString())) {
                currentNode.classList.remove('highlight');
            }
            sWaveId = 's' + currentNode.id;
            hWaveId = 'h' + currentNode.id;
            
            if(sWaveId in wavesurfer.regions.list) {
                wavesurfer.regions.list[sWaveId].remove();
            } else {
                if(hWaveId in wavesurfer.regions.list) {
                    wavesurfer.regions.list[hWaveId].remove();
                }
                wavesurfer.addRegion({
                    id: sWaveId,
                    start: currentNode.getAttribute('starttime'),
                    end: currentNode.getAttribute('endtime'),
                    color: 'rgba(100, 100, 100, 0.5)',
                    drag: false,
                    resize: false
                });
            }

            var r_i = currentNode.getAttribute('resultindex');
            var a_i = currentNode.getAttribute('alternativeindex');
            var w_i = currentNode.getAttribute('wordindex');

            if(transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3]) {
                if(transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike) {
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
                } else {
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
                }
            } else {
                transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
                transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
                transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
            }
        }

        getStrikes();
        if(playHighlights) {
            getHighlights();
        }
    },

    'highlight': function() {
        pastStack.push(JSON.stringify(transcript));
        if(window.getSelection && window.getSelection().toString().split('').length > 1) {
            var startElement = window.getSelection().anchorNode.parentElement;
            while(startElement.classList[0] != 'word') {
                startElement = startElement.nextSibling;
            }
            var endElement = window.getSelection().focusNode.parentElement;
            while(endElement.classList[0] != 'word') {
                endElement = endElement.nextSibling;
            }
            if(Number(startElement.id) > Number(endElement.id)) {
                var temp = startElement;
                startElement = endElement;
                endElement = temp;
            }
            var currentNode = document.getElementById(startElement.id);
            while(Number(currentNode.id) <= Number(endElement.id)) {
                currentNode.classList.toggle('highlight');
                if(/strike/i.test(currentNode.classList.toString())) {
                    currentNode.classList.remove('strike');
                }
                sWaveId = 's' + currentNode.id;
                hWaveId = 'h' + currentNode.id;
                if(hWaveId in wavesurfer.regions.list) {
                    wavesurfer.regions.list[hWaveId].remove();
                } else {
                    if(sWaveId in wavesurfer.regions.list) {
                        wavesurfer.regions.list[sWaveId].remove();
                    }
                    wavesurfer.addRegion({
                        id: hWaveId,
                        start: currentNode.getAttribute('starttime'),
                        end: currentNode.getAttribute('endtime'),
                        color: 'rgba(255, 255, 0, 0.3)',
                        drag: false,
                        resize: false
                    });
                }

                var r_i = currentNode.getAttribute('resultindex');
                var a_i = currentNode.getAttribute('alternativeindex');
                var w_i = currentNode.getAttribute('wordindex');
                
                if(transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3]) {
                    if(transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight) {
                        transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
                    } else {
                        transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
                        transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
                    }
                } else {
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
                }

                if(currentNode.nextSibling) {
                    currentNode = currentNode.nextSibling;
                } else {
                    break;
                }
            }
        } else {
            var readEle = document.getElementsByClassName('read');
            
            if(readEle.length <= 0) {
                currentNode = document.getElementsByClassName('word')[0];
            } else if(readEle[readEle.length - 1].nextSibling) {
                currentNode = readEle[readEle.length - 1].nextSibling;
            } else if (readEle[readEle.length - 1].parentNode.nextSibling.nextSibling.nextSibling) {
                currentNode = readEle[readEle.length - 1].parentNode.nextSibling.nextSibling.nextSibling.firstChild;
            } else {
                currentNode = readEle[readEle.length - 1];
            }

            currentNode.classList.toggle('highlight');
            if(/strike/i.test(currentNode.classList.toString())) {
                currentNode.classList.remove('strike');
            }
            sWaveId = 's' + currentNode.id;
            hWaveId = 'h' + currentNode.id;
            
            if(hWaveId in wavesurfer.regions.list) {
                wavesurfer.regions.list[hWaveId].remove();
            } else {
                if(sWaveId in wavesurfer.regions.list) {
                    wavesurfer.regions.list[sWaveId].remove();
                }
                wavesurfer.addRegion({
                    id: hWaveId,
                    start: currentNode.getAttribute('starttime'),
                    end: currentNode.getAttribute('endtime'),
                    color: 'rgba(255, 255, 0, 0.3)',
                    drag: false,
                    resize: false
                });
            }

            var r_i = currentNode.getAttribute('resultindex');
            var a_i = currentNode.getAttribute('alternativeindex');
            var w_i = currentNode.getAttribute('wordindex');
            
            if(transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3]) {
                if(transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight) {
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
                } else {
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
                    transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
                }
            } else {
                transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
                transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
                transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
            }
        }

        getStrikes();
        if(playHighlights) {
            getHighlights();
        }
    },

    'undo': function() {
        var currAction;
        if(pastStack.length > 0) {
            futureStack.push(JSON.stringify(transcript));
            currAction = pastStack.pop()
            transcript = {};
            transcript = JSON.parse(currAction);
            fillWords();
        }
    },

    'redo': function() {
        var currAction;
        if(futureStack.length > 0) {
            pastStack.push(JSON.stringify(transcript));
            currAction = futureStack.pop()
            transcript = JSON.parse(currAction);
            fillWords();
        }
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

// save transcript
function saveJSON(alertUser) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200) {
            console.log(this.responseText);
            if(alertUser) {
                alert('Changes successfully saved.');
            }
        } else if(this.readyState === 4 && this.status != 200) {
            alert('Could not save changes, please check your internet connection or try again later.'); 
        }
    }
    xhttp.open('POST', './save.php', true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send('transcript=' + JSON.stringify(transcript));
}

// generate highlight array
function getHighlights() {
    var keys = Array();
    var temp = Array();
    
    // sort regions in waveform according to time
    for(var i in wavesurfer.regions.list) {
        if(/^h/i.test(i)) {
            temp.push(wavesurfer.regions.list[i].start);
        }
    }
    temp.sort(function(a, b) { return a - b; });
    temp = temp.map(function(item) { return 'h' + item; });
    // get sorted regions
    temp.forEach(function(item) {
        keys.push(wavesurfer.regions.list[item]);
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
    var temp = Array();

    // sort striked regions in waveform
    for(var i in wavesurfer.regions.list) {
        if(/^s/i.test(i)) {
            temp.push(wavesurfer.regions.list[i].start);
        }
    }
    temp.sort(function(a, b) { return a - b; });
    temp = temp.map(function(item) { return 's' + item; });

    // get sorted regions
    temp.forEach(function(item) {
        keys.push(wavesurfer.regions.list[item]);
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

function showFindReplace(event) {
    var ele = document.getElementById('find-replace-wrapper');
    ele.setAttribute('style', 'top: ' + event.clientY + 'px; left: ' + event.clientX + 'px;');
    ele.classList.remove('hidden');
    setTimeout(function() {
        ele.classList.remove('invisible');
    }, 50);
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
    var datalist = document.getElementById('speakerlist');

    // clear the div before adding content (helpful when undo / redo refreshes content)
    while(textArea.hasChildNodes()) {
        textArea.removeChild(textArea.lastChild);
    }

    // retain the speaker datalist
    textArea.appendChild(datalist);
    
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
                div.setAttribute('contenteditable', 'true');
                div.classList.add('speaker-div');

                // input field for speaker name
                speakerName = document.createElement('input');
                speakerName.value = currentSpeaker;
                speakerName.id = 'speaker' + (i - 1);
                speakerName.classList.add('speaker');
                speakerName.setAttribute('list', 'speakerlist');
                speakerName.setAttribute('name', 'speaker');
                speakerName.setAttribute('speakername', currentSpeaker);
                speakerName.setAttribute('speakerindex', (i - 1));
                speakerName.setAttribute('style', 'width: ' + ((speakerName.value.length * 8) + 20) + 'px');
                speakerName.setAttribute('onkeyup', 'resizeInput(this);');
                speakerName.setAttribute('onclick', 'handleList(this)');
                speakerName.setAttribute('onblur', 'handleValue(this)');
                speakerName.setAttribute('onchange', 'changeInput(this);');
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

    // add observer for each word
    [].forEach.call(document.querySelectorAll('.word'), function(el) {
        wordObserver.observe(el, {characterData: true, subtree: true});
    });

    // add oobserver for removed nodes
    [].forEach.call(document.querySelectorAll('.speaker-div'), function(el) {
        nodeObserver.observe(el, {childList: true});
    });

    // get highlights and strike arrays for skipping playback
    getHighlights();
    getStrikes();
}

function wordMutation(mutation) {
    mutation.forEach(function(m) {
        var word = m.target.parentElement;

        // get position of current word in transcript json
        var r_i = word.getAttribute('resultindex');
        var a_i = word.getAttribute('alternativeindex');
        var w_i = word.getAttribute('wordindex');

        // check if value has changed
        if( word.innerText != transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][0] ) {
            // push current content to undo stack
            pastStack.push(JSON.stringify(transcript));

            // add new value to chunk
            var newValue = word.innerText;
            transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][0] = newValue;

            // generate new chunk content
            var newTranscript = '';
            transcript.results[0].results[r_i].alternatives[a_i].timestamps.forEach(function(word) {
                newTranscript += word[0];
            });
            transcript.results[0].results[r_i].alternatives[a_i].transcript = newTranscript;

            // approximate timestamps
            var endTime, startTime;
            // if this is first word of speaker
            if(this === word.parentElement.firstChild) {
                // if first word in transcript
                if(r_i === '0') {
                    startTime = '0';
                } else if(w_i === '0') {
                    // start time of current changed to end of previous chunk
                    var pre_r_i = Number(r_i) - 1;
                    var pre_index = transcript.results[0].results[pre_r_i].alternatives[0].timestamps.length - 1;
                    startTime = transcript.results[0].results[pre_r_i].alternatives[0].timestamps[pre_index][2];
                } else {
                    var pre_index = Number(w_i) - 1;
                    startTime = transcript.results[0].results[r_i].alternatives[0].timestamps[pre_index][2];
                }
                transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][1] = startTime;
                word.setAttribute('starttime', startTime);
                word.id = startTime;
                word.setAttribute('title', startTime + ' - ' + word.getAttribute('endtime'));
            } else if(word.nextSibling) {
                endTime = word.nextSibling.getAttribute('starttime');
                transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][2] = endTime;
                word.setAttribute('endtime', endTime);
                word.setAttribute('title', word.getAttribute('starttime') + ' - ' + endTime);
            }
            // not approximating the time if the word is last in the current chunk

            // adjust to new timestamps
            if(/highlight/i.test(word.classList.value)) {
                GLOBAL_ACTIONS['highlight']();
                GLOBAL_ACTIONS['highlight']();
            }
            if(/strike/i.test(word.classList.value)) {
                GLOBAL_ACTIONS['strike']();
                GLOBAL_ACTIONS['strike']();
            }
        }
    });
}

function nodeMutation(mutation) {
    if(mutation[0].addedNodes.length > 0) {
        wordObserver.disconnect();
        globaluksp++;
        mutation.forEach(function(m) {
            m.removedNodes.forEach(function(node) {
                if(node.innerText.trim() != '') {
                    index = node.getAttribute('speakerindex');
                    transcript.results[0].speaker_labels[index].speaker = 'Unknown Speaker ' + globaluksp;
                }
            });
        });
        fillWords();
    } else {
        mutation.forEach(function(m) {
            m.removedNodes.forEach(function(node) {
                // get position of current word in transcript json
                var r_i = node.getAttribute('resultindex');
                var a_i = node.getAttribute('alternativeindex');
                var w_i = node.getAttribute('wordindex');

                transcript.results[0].results[r_i].alternatives[a_i].timestamps[w_i][0] = '';
            }); 
        });
    }
}

function readWords() {
    readWord = document.getElementsByClassName('read');
    try {
        currWord = readWord[0] ? (readWord[readWord.length - 1].nextSibling ? readWord[readWord.length - 1].nextSibling : readWord[readWord.length - 1].parentElement.nextSibling.nextSibling.nextSibling.firstChild) : document.getElementsByClassName('word')[0];
    } catch (exception) {
        currWord = document.getElementsByClassName('word')[0];
    }
    if(currWord.id < wavesurfer.getCurrentTime()) {
        while(currWord && currWord.id < wavesurfer.getCurrentTime()) {
            currWord.classList.add('read');
            currWord = currWord.nextSibling ? currWord.nextSibling : currWord.parentElement.nextSibling.nextSibling.nextSibling.firstChild;
        }
        var divEnds = document.getElementById('transcript-area').getBoundingClientRect();
        if(divEnds.bottom < currWord.getBoundingClientRect().bottom || divEnds.top > currWord.getBoundingClientRect().top) {
            currWord.scrollIntoView();
        }
    } else {
        [].forEach.call(document.querySelectorAll('.read'), function(el) {
            if(el.id > wavesurfer.getCurrentTime()) {
                el.classList.remove('read');
            }
        })
    }
}

function changeInput(caller) {
    if(!caller.value || caller.value.trim() === '' || caller.value === 'Remove Speaker') {
        changed = false;
        caller.value = 'Unknown Speaker ' + (globaluksp++);
        var startIndex = caller.getAttribute('speakerindex');
        var endIndex = caller.nextSibling.nextSibling.nextSibling ? Number(caller.nextSibling.nextSibling.nextSibling.getAttribute('speakerindex')) : transcript.results[0].speaker_labels.length;

        for(var i = startIndex; i < endIndex; i++) {
            transcript.results[0].speaker_labels[i].speaker = caller.value;
        }
    } else {
        var input = caller.value;
        var oldName = caller.getAttribute('speakername');
        pastStack.push(JSON.stringify(transcript));
        var inputLength = (caller.value.length * 8) + 30;
        transcript.results[0].speaker_labels.forEach(function(el) {
            if(el.speaker == oldName) {
                el.speaker = input;
            }
        });

        var speakerList = document.getElementById('speakerlist');

        var hasInput = false;
        [].forEach.call(speakerList.childNodes, function(el) {
            if(el.value == input) {
                hasInput = true;
            }
        });
        if(!hasInput) {
            datalistOption = document.createElement('option');
            datalistOption.value = input;
            speakerList.appendChild(datalistOption);
        }
    }

    fillWords();
}

function handleList(caller) {
    caller.value = '';
}

function handleValue(caller) {
    if(changed && (!caller.value || caller.value.trim() == '')) {
        changed = false;
        caller.value = 'Unknown Speaker ' + (globaluksp++);
        var startIndex = caller.getAttribute('speakerindex');
        var endIndex = caller.nextSibling.nextSibling.nextSibling ? Number(caller.nextSibling.nextSibling.nextSibling.getAttribute('speakerindex')) : transcript.results[0].speaker_labels.length;

        for(var i = startIndex; i < endIndex; i++) {
            transcript.results[0].speaker_labels[i].speaker = caller.value;
        }

        fillWords();
    } else {
        pastStack.push(JSON.stringify(transcript));
        caller.value = caller.getAttribute('speakername');
    }
}

function closeSpeaker(caller) {
    caller.parentElement.parentElement.classList.add('invisible');
    setTimeout(function() {
        caller.parentElement.parentElement.classList.add('hidden');
    }, 50);
}

function resizeInput(caller) {
    caller.setAttribute('style', 'width: ' + ((caller.value.length * 8) + 30) + 'px');
    changed = true;
}

function checkDeepLink() {
    var getVars = {};
    window.location.search.slice(1).split('&').forEach(function(getVar) {
        var temp = getVar.split('=');
        getVars[temp[0]] = temp[1];
    });
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

window.onbeforeunload = function(e) {
    e || window.event;
    if(e) {
        return '';
    }
    return '';
}

// Initialization
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
    loadJSON('transcript/testimony_meta.json', function(text) {
        var metadata = JSON.parse(text);
        silences = metadata.silences;
        wavesurfer.load('audio/testimony.mp3', metadata.peaks, 'none');
    });

    // load transcript
    

    // handle events while playing
    wavesurfer.on('audioprocess', function() {
        curr = wavesurfer.getCurrentTime().toFixed(1);
        readWords();

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
    });

    // startup the page
    wavesurfer.on('ready', function() {
        var timeline = Object.create(WaveSurfer.Timeline);

        timeline.init({
            wavesurfer: wavesurfer,
            container: '#audioclip-timeline',
            primaryColor: '#3f88c5',
            seondaryColor: '#f4364c',
            primaryFontColor: '#f6f7eb',
            secondaryFontColor: '#f6f7eb',
            timeInterval: 150,
            height: 15
        });

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
        [].forEach.call(document.querySelectorAll('.speaker'), function(el) {
            if(/Unknown Speaker/i.test(el.value)) {
                globaluksp++;
            }
        });
        activeSpeed();

        nodeObserver = new MutationObserver(function(mutation) {
            nodeMutation(mutation);
        });
        wordObserver = new MutationObserver(function(mutation) {
            wordMutation(mutation);
        });
        loadJSON('transcript/testimony_prepared.json', function(text) {
            transcript = JSON.parse(text);
            pastStack.push(JSON.stringify(transcript));
            fillWords();
        });

        setInterval(function() {
            saveJSON(false);
        }, 60000)
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
            82: 'rewind',       // R
            72: 'highlight',    // H
            74: 'strike',       // J
            90: 'undo',         // Z
            83: 'save',         // S
        }
        if(e.ctrlKey) {
            shortcutWrapper.classList.remove('hidden');
            if(e.shiftKey) {
                shift_key.classList.remove('hidden');
            }
            var action = map[e.keyCode];
            if(action in GLOBAL_ACTIONS) {
                e.preventDefault();
                if(e.shiftKey && action == 'undo') {
                    extra_key.innerHTML = 'Z';
                    extra_key.classList.remove('hidden');
                    GLOBAL_ACTIONS['redo']();
                } else {
                    if(e.keyCode == 32) {
                        space_key.classList.remove('hidden');
                    } else {
                        extra_key.innerHTML = e.key.toUpperCase();
                        extra_key.classList.remove('hidden');
                    }
                    GLOBAL_ACTIONS[action]();
                }
            }
        }
    });

    document.addEventListener('keyup', function(e) {
        if(!/hidden/i.test(shortcutWrapper.classList.toString())) {
            shortcutWrapper.classList.add('hidden');
        }
        if(!/hidden/i.test(shift_key.classList.toString())) {
            shift_key.classList.add('hidden');
        }
        if(!/hidden/i.test(extra_key.classList.toString())) {
            extra_key.classList.add('hidden');
        }
        if(!/hidden/i.test(space_key.classList.toString())) {
            space_key.classList.add('hidden');
        }
    })

    document.getElementById('find').addEventListener('keyup', function() {
        var input = this.value;
        [].forEach.call(document.querySelectorAll('.word'), function(el) {
            if(el.innerText.search(input) >= 0) {
                if(!/found/i.test(el.classList.toString())) {
                    el.classList.add('found');
                }
            } else {
                if(/found/i.test(el.classList.toString())) {
                    el.classList.remove('found');
                }
            }
        });
    });

    document.getElementById('find-replace-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var foundWord = document.getElementById('find').value;
        var replaceWord = document.getElementById('replace').value;
        var counter = 0;
        [].forEach.call(document.querySelectorAll('.word'), function(el) {
            if(el.innerText.search(foundWord) >= 0) {
                el.innerText = el.innerText.replace(foundWord, replaceWord);
                counter++;
            }
        });
        document.getElementById('find-replace-wrapper').classList.add('hidden');
        setTimeout(function() {
            [].forEach.call(document.querySelectorAll('.found'), function(el) {
                el.classList.remove('found');
            });
        }, 1000);
        setTimeout(function() {
            alert('Replaced ' + counter + ' occurrences of \'' + foundWord + '\' with \'' + replaceWord + '\'.');
        }, 100);
    });

    var range;
    document.getElementById('audioclip').addEventListener('mousedown', function(e) {
        setTimeout(function() {
            var startEle = document.getElementsByClassName('read');
            range = document.createRange();
            try {
                range.setStart(startEle[startEle.length - 1], 0);
            } catch (exception) {}
        }, 100);
    });

    document.getElementById('audioclip').addEventListener('mouseup', function(e) {
        setTimeout(function() {
            var endEle = document.getElementsByClassName('read');
            range.setEnd(endEle[endEle.length - 1], 0);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }, 100);
    });
});