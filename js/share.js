var wavesurfer = Object.create(WaveSurfer);

// global variables
var transcript;
var silences = Array();
var highlights = Array();
var strikes = Array();

var skipSilences = false;
var playHighlights = false;

var GLOBAL_ACTIONS = {
	
	'play': function() {
		wavesurfer.playPause();
		togglePlayPause();
	},

	'stop': function() {
		wavesurfer.stop();
		togglePlayPause();
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
		toggleActive(document.getElementById('bt-skipsilence'));
	},

	'close-export': function() {
		document.getElementById('export-wrapper').classList.add('invisible');
		setTimeout(function() {
			document.getElementById('export-wrapper').classList.add('hidden');
		}, 50);
	},

	'export-srt': function() {
		var results = transcript.results;
		var speakers = transcript.speaker_labels;
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
							sentence += '<b>' + word[0] + '</b> ';
						}
					}
				} else {
					if(currentSpeaker != prevSpeaker) {
						sentence += '(' + currentSpeaker + ') ';
					}
					if(word[3]) {
						if(!word[3].strike) {
							if(word[3].highlight) {
								sentence += '<b>' + word[0] + '</b> ';
							} else {
								sentence += word[0] + ' ';
							}
						}
					} else {
						sentence += word[0] + ' ';
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
		var results = transcript.results;
		var speakers = transcript.speaker_labels;
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
								sentence += '(' + currentSpeaker + ')';
							}
							sentence += '<b>' + word[0] + '</b> ';
						}
					}
				} else {
					if(currentSpeaker != prevSpeaker) {
						sentence += '(' + currentSpeaker + ') ';
					}
					if(word[3]) {
						if(!word[3].strike) {
							if(word[3].highlight) {
								sentence += '<b>' + word[0] + '</b> ';
							} else {
								sentence += word[0] + ' ';
							}
						}
					} else {
						sentence += word[0] + ' ';
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
		var results = transcript.results;
		var speakers = transcript.speaker_labels;
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
								sentence += words[i][0] + ' ';
							}
						}
					}
				} else {
					if(words[i][3]) {
						if(!words[i][3].strike) {
							if(words[i][3].highlight) {
								sentence += words[i][0] + ' ';
							} else {
								sentence += words[i][0] + ' ';
							}
						}
					} else {
						sentence += words[i][0] + ' ';
					}
				}
				i++;
			} while(currentSpeaker == nextSpeaker && i < words.length);
			if(onlyHighlight && currentPara == '') {
				sentence += ' [' + toHHMMssmmm(words[i - 1][2]).replace(',', '.') + ']\n\n';
			} else if(!onlyHighlight && !currentPara) {
				sentence += ' [' + toHHMMssmmm(words[i - 1][2]).replace(',', '.') + ']\n\n';
			}
		}

		var pdf = new jsPDF();
		pdf.setFontSize(12);
		var splitSentence = pdf.splitTextToSize(sentence, 160);
		pdf.text(splitSentence, 10, 10);
		pdf.save('transcript.pdf');

		GLOBAL_ACTIONS['close-export']();
	},

	'export-doc': function() {
		var results = transcript.results;
		var speakers = transcript.speaker_labels;
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
								sentence += '<w:r><w:rPr><w:highlight w:val="yellow" /></w:rPr><w:t>' + words[i][0] + ' </w:t></w:r>';
							}
						}
					}
				} else {
					if(words[i][3]) {
						if(!words[i][3].strike) {
							if(words[i][3].highlight) {
								sentence += '<w:r><w:t>' + words[i][0] + ' </w:t></w:r>';
							} else {
								sentence += '<w:r><w:t>' + words[i][0] + ' </w:t></w:r>';
							}
						}
					} else {
						sentence += '<w:r><w:t>' + words[i][0] + ' </w:t></w:r>';
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

		function loadFile(url,callback){
			JSZipUtils.getBinaryContent(url,callback);
		}

		loadFile("./src/template.docx",function(error,content){
			if (error) { throw error };
			var zip = new JSZip(content);
			var doc=new Docxtemplater().loadZip(zip)
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
				console.log(JSON.stringify({error: e}));
				throw error;
			}

			var out=doc.getZip().generate({
				type:"blob",
				mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			}) 
			saveAs(out,"transcript.docx")
		})

		GLOBAL_ACTIONS['close-export']();
	},

	'playhighlight': function() {
		if(!playHighlights) {
			for(var i in wavesurfer.regions.list) {
				if(/^h/i.test(i)) {
					wavesurfer.seekTo(wavesurfer.regions.list[i].start / wavesurfer.getDuration());
					break;
				}
			}
		}
		playHighlights = !playHighlights;
		toggleActive(document.getElementById('bt-playhighlight'));
	}
}

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

// set colors to active elements
function toggleActive(caller) {
	caller.classList.toggle('active');
}

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

function getSilences() {
	var peaks = wavesurfer.backend.getPeaks(Math.floor(wavesurfer.backend.buffer.length / 100));
	var unit = 0.00002267573 * 100;
	var start, end;
	for(var i = 0; i < peaks.length; i++) {
		if(peaks[i] < 0.01) {
			start = Number(((unit * i) + 0.02).toFixed(1));
			while(peaks[i] < 0.01) {i++;}
			end = Number(((unit * i) - 0.02).toFixed(1));
			if(end > start) {
				silences[start] = Number((end - start).toFixed(1));
			}
		}
	}
}

function getHighlights() {
	var keys = Array();
	var temp = Array();
	
	for(var i in wavesurfer.regions.list) {
		if(/^h/i.test(i)) {
			temp.push(wavesurfer.regions.list[i].start);
		}
	}

	temp.sort(function(a, b) { return a - b; });
	temp = temp.map(function(item) { return 'h' + item; });

	temp.forEach(function(item) {
		keys.push(wavesurfer.regions.list[item]);
	});

	highlights = [];

	if(keys.length > 0) {
		highlights['0'] = Number((keys[0].start).toFixed(1));
		for(var i = 1; i < keys.length - 1; i++) {
			var duration = Number((keys[i + 1].start - keys[i].end).toFixed(1));
			if(duration >= 0) {
				highlights[(keys[i].end).toFixed(1)] = duration;
			}
		}
		if(keys.length > 1) {
			highlights[keys[i].end.toFixed(1)] = Number((wavesurfer.getDuration() - keys[i].end).toFixed(1));
		}
	}
}

function getStrikes() {
	var keys = Array();
	var temp = Array();

	for(var i in wavesurfer.regions.list) {
		if(/^s/i.test(i)) {
			temp.push(wavesurfer.regions.list[i].start);
		}
	}

	temp.sort(function(a, b) { return a - b; });
	temp = temp.map(function(item) { return 's' + item; });

	temp.forEach(function(item) {
		keys.push(wavesurfer.regions.list[item]);
	});
	
	strikes = [];

	j = 1;
	for(var i = 0; i < keys.length - 1; i++) {
		var duration = Number((keys[i].end - keys[i].start).toFixed(1));
		if(keys[i].end.toFixed(1) == keys[i + j].start.toFixed(1)) {
			strikes[(keys[i].start).toFixed(1)] = Number((duration + (keys[i + j].end - keys[i + j].start)).toFixed(1));
			i + j;
		} else {
			strikes[(keys[i].start).toFixed(1)] = duration;
			j = 1;
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

function enableUI() {
	document.getElementById('loader').classList.toggle('spinning');
	document.getElementById('main-container-mask').classList.toggle('invisible');
	setInterval(function() {
		document.getElementById('main-container-mask').setAttribute('style', 'display: none');
		document.getElementById('loading-percentage').innerHTML = '';
	}, 300);
}

function resizeBody() {
	var off = document.getElementsByClassName('main-container')[0].offsetHeight;
	var height = window.innerHeight - off;
	document.getElementsByClassName('transcript-container')[0].setAttribute('style', 'height: ' + height + 'px');
	document.getElementById('text-options').setAttribute('style', 'margin-top: ' + off + 'px');
}

// fill editor with words from database
function fillWords() {
	var results = transcript.results;
	var speakers = transcript.speaker_labels;
	var words = Array();
	var toReach = Array();
	var maxAlternativeIndex;
	
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
			toReach.push([resultIndex, maxAlternativeIndex, wordIndex]);
		});
	});

	var textArea = document.getElementById('transcript-area');
	var currentSpeaker, nextSpeaker, div, speakerName, word, colonSpan, deleteSpeaker;
	var datalist = document.getElementById('speakerlist');
	for(var i = 0; i < words.length - 1;) {
		currentSpeaker = speakers[i].speaker;
		nextSpeaker = speakers[i + 1].speaker;
		div = document.createElement('div');
		div.setAttribute('title', currentSpeaker);
		div.classList.add('speaker-div');
		speakerName = document.createElement('input');
		speakerName.value = currentSpeaker;
		speakerName.id = 'speaker' + i;
		speakerName.classList.add('speaker');
		speakerName.setAttribute('disabled', '');
		speakerName.setAttribute('name', 'speaker');
		speakerName.setAttribute('speakername', currentSpeaker);
		speakerName.setAttribute('speakerindex', i);
		speakerName.setAttribute('style', 'width: ' + ((speakerName.value.length * 8) + 20) + 'px');
		textArea.appendChild(speakerName);
		do {
			nextSpeaker = speakers[i + 1].speaker;
			word = document.createElement('span');
			word.innerText = words[i][0] + " ";
			word.setAttribute('starttime', words[i][1]);
			word.setAttribute('endtime', words[i][2]);
			word.setAttribute('resultindex', toReach[i][0]);
			word.setAttribute('alternativeindex', toReach[i][1]);
			word.setAttribute('wordindex', toReach[i][2]);
			word.setAttribute('title', words[i][1] + " - " + words[i][2]);
			word.setAttribute('tabindex', '-1');
			word.addEventListener('focus', function() { enableInput(this); });
			word.setAttribute('id', words[i][1]);
			word.classList.add('word');
			var hWaveId = 'h' + words[i][1];
			var sWaveId = 's' + words[i][1];
			if(words[i][3]) {
				if(words[i][3].highlight) {
					word.classList.add('highlight');
					if(hWaveId in wavesurfer.regions.list) {

					} else {
						wavesurfer.addRegion({
							id: hWaveId,
							start: word.getAttribute('starttime'),
							end: word.getAttribute('endtime'),
							color: 'rgba(255, 255, 0, 0.3)',
							drag: false,
							resize: false
						});
					}
				} else {
					if(hWaveId in wavesurfer.regions.list) {
						wavesurfer.regions.list[hWaveId].remove();
					}
				}
			} else {
				if(hWaveId in wavesurfer.regions.list) {
					wavesurfer.regions.list[hWaveId].remove();
				}
			}
			if(words[i][3]) {
				if(words[i][3].strike) {
					word.classList.add('strike');
					if(sWaveId in wavesurfer.regions.list) {

					} else {
						wavesurfer.addRegion({
							id: sWaveId,
							start: word.getAttribute('starttime'),
							end: word.getAttribute('endtime'),
							color: 'rgba(100, 100, 100, 0.5)',
							drag: false,
							resize: false
						});
					}
				} else {
					if(sWaveId in wavesurfer.regions.list) {
						wavesurfer.regions.list[sWaveId].remove();
					}
				}
			} else {
				if(sWaveId in wavesurfer.regions.list) {
					wavesurfer.regions.list[sWaveId].remove();
				}
			}
			div.appendChild(word);
			i++;
		} while(currentSpeaker == nextSpeaker && i < words.length - 1);

		textArea.appendChild(div);
		var specialBreak = document.createElement('br');
		specialBreak.classList.add('special-break');
		textArea.appendChild(specialBreak);
	}

	getHighlights();
	getStrikes();
}

function readWords() {
	[].forEach.call(document.getElementsByClassName('word'), function(el) {
		if( el.id < wavesurfer.getCurrentTime() ) {
			el.classList.add('read');
		} else {
			el.classList.remove('read');
		}
	});
}

function enableInput(caller) {
	wavesurfer.seekTo(caller.id / wavesurfer.getDuration());
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

// Initialization
document.addEventListener('DOMContentLoaded', function() {
	// wavesurfer options
	var options = {
		container: document.querySelector('#audioclip'),
		progressColor: '#f4364c',
		waveColor: '#3f88c5',
		cursorWidth: 2,
		cursorColor: '#3f88c5',
		hideScrollbar: true,
		height: 95
	};

	wavesurfer.init(options);
	
	// load audio
	wavesurfer.load('audio/2.wav');
	loadJSON('transcript/2.json', function(text) {
		transcript = JSON.parse(text);
	});

	// handle events while playing
	wavesurfer.on('audioprocess', function() {
		curr = wavesurfer.getCurrentTime().toFixed(1);
		readWords();
		
		if(skipSilences) {
			if( curr in silences ) {
				wavesurfer.skip(silences[curr]);
			}
		}

		if(playHighlights) {
			if( curr in highlights ) {
				wavesurfer.skip(highlights[curr]);
			}
		}

		if( curr in strikes ) {
			wavesurfer.skip(strikes[curr]);
		}
	});

	wavesurfer.on('finish', function() { 
		GLOBAL_ACTIONS['stop']();
	});

	wavesurfer.on('seek', function() {
		readWords();
	});

	wavesurfer.on('loading', function(callback) {
		document.getElementById('loading-percentage').innerHTML = callback + '%';
		if( callback < 40 ) document.getElementById('loading-text').innerHTML = 'Loading audio clip...';
		else if( callback < 60 ) document.getElementById('loading-text').innerHTML = 'Doing some math...';
		else if( callback < 80 ) document.getElementById('loading-text').innerHTML = 'This only happens the first time...';
		else if( callback < 95 ) document.getElementById('loading-text').innerHTML = 'Really...';
		else document.getElementById('loading-text').innerHTML = 'Almost done...';
		
	});

	// startup the page
	wavesurfer.on('ready', function() {
		// dummy region ( to startup regions plugin )
		wavesurfer.addRegion({
			id: 'dummy',
			start: 0,
			end: 0,
			drag: false,
			resize: false,
			color: 'rgba(255, 255, 0, 0)'
		});
		activeSpeed();
		getSilences();
		fillWords();
		resizeBody();
		checkDeepLink();
		enableUI();
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
	var extra_key = document.getElementById('extra-key');
	document.addEventListener('keydown', function(e) {
		var map = {
			32: 'play', 		// space
			82: 'rewind', 		// R
		}
		if(e.ctrlKey) {
			shortcutWrapper.classList.remove('hidden');
			if(e.shiftKey) {
				shift_key.classList.remove('hidden');
			}
			var action = map[e.keyCode];
			if(action in GLOBAL_ACTIONS) {
				e.preventDefault();
				extra_key.innerHTML = e.key.toUpperCase();
				extra_key.classList.remove('hidden');
				GLOBAL_ACTIONS[action]();
				
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
	});
});