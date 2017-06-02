var wavesurfer = Object.create(WaveSurfer);

// global variables
var transcript;
var silences = Array();
var highlights = Array();
var strikes = Array();
var pastStack = Array();
var futureStack = Array();

var skipSilences = false;
var playHighlights = false;

var undoAction = false;

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
	},

	'strike': function() {
		//console.log(window.getSelection + " " + window.getSelection().toString().split('').length);
		if(window.getSelection && window.getSelection().toString().split('').length > 1) {
			//console.log('condition 1 active');
			var startElement = window.getSelection().anchorNode.parentElement;
			if(startElement.classList[0] != 'word') {
				startElement = startElement.nextSibling;
			}
			//console.log('startElement: ' + startElement.id)
			var endElement = window.getSelection().extentNode.parentElement;
			if(endElement.classList[0] != 'word') {
				endElement = endElement.nextSibling;
			}
			//console.log('endElement: ' + endElement.id);
			if(Number(startElement.id) > Number(endElement.id)) {
				var temp = startElement;
				startElement = endElement;
				endElement = temp;
				//console.log('swapping');
			}
			//console.log('after swipe: ' + startElement.id + ' ' + endElement.id);
			var waveId = 's' + startElement.id;
			var currentNode = document.getElementById(startElement.id);
			//console.log('currentNode: ' + currentNode.id + ' endElement: ' + endElement.id);
			while(Number(currentNode.id) <= Number(endElement.id)) {
				//console.log('in while');
				//console.log('currentNode: ' + currentNode.id);
				currentNode.classList.toggle('strike');
				waveId = 's' + currentNode.id;
				if(waveId in wavesurfer.regions.list) {
					wavesurfer.regions.list[waveId].remove();
				} else {
					wavesurfer.addRegion({
						id: waveId,
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
				
				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike) {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike = false;	
				} else {
					//console.log('initializing');
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike = true;
				}

				pastStack.push(['s', currentNode.id]);

				if(currentNode.nextSibling) {
					currentNode = currentNode.nextSibling;
					//console.log('nextSibling: ' + currentNode.id);
				} else {
					//console.log('nextSibling break');
					break;
				}
			}
			//console.log('while end');
		} else {
			//console.log('condition 2 active');
			var readEle = document.getElementsByClassName('read');
			
			if(readEle[readEle.length - 1].nextSibling) {
				currentNode = readEle[readEle.length - 1].nextSibling;
			} else if (readEle[readEle.length - 1].parentNode.nextSibling) {
				currentNode = readEle[readEle.length - 1].parentNode.nextSibling.firstChild.nextSibling;
			} else {
				currentNode = readEle[readEle.length - 1];
			}
			//console.log('currentNode: ' + currentNode.id);
			currentNode.classList.toggle('strike');
			waveId = 's' + currentNode.id;
			
			if(waveId in wavesurfer.regions.list) {
				wavesurfer.regions.list[waveId].remove();
			} else {
				wavesurfer.addRegion({
					id: waveId,
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
			
			if(transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike) {
				transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike = false;	
			} else {
				//console.log('initializing');
				transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike = true;
			}

			pastStack.push(['s', currentNode.id]);
		}

		getStrikes();
	},

	'highlight': function() {
		//console.log(window.getSelection + " " + window.getSelection().toString().split('').length);
		if(window.getSelection && window.getSelection().toString().split('').length > 1) {
			//console.log('condition 1 active');
			var startElement = window.getSelection().anchorNode.parentElement;
			if(startElement.classList[0] != 'word') {
				startElement = startElement.nextSibling;
			}
			//console.log('startElement: ' + startElement.id)
			var endElement = window.getSelection().extentNode.parentElement;
			if(endElement.classList[0] != 'word') {
				endElement = endElement.nextSibling;
			}
			//console.log('endElement: ' + endElement.id);
			if(Number(startElement.id) > Number(endElement.id)) {
				var temp = startElement;
				startElement = endElement;
				endElement = temp;
				//console.log('swapping');
			}
			//console.log('after swipe: ' + startElement.id + ' ' + endElement.id);
			var waveId = 'h' + startElement.id;
			var currentNode = document.getElementById(startElement.id);
			//console.log('currentNode: ' + currentNode.id + ' endElement: ' + endElement.id);
			while(Number(currentNode.id) <= Number(endElement.id)) {
				//console.log('in while');
				//console.log('currentNode: ' + currentNode.id);
				currentNode.classList.toggle('highlight');
				waveId = 'h' + currentNode.id;
				if(waveId in wavesurfer.regions.list) {
					wavesurfer.regions.list[waveId].remove();
				} else {
					wavesurfer.addRegion({
						id: waveId,
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
				
				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight) {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight = false;	
				} else {
					//console.log('initializing');
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight = true;
				}

				pastStack.push(['h', currentNode.id]);

				if(currentNode.nextSibling) {
					currentNode = currentNode.nextSibling;
					//console.log('nextSibling: ' + currentNode.id);
				} else {
					//console.log('nextSibling break');
					break;
				}
			}
			//console.log('while end');
		} else {
			//console.log('condition 2 active');
			var readEle = document.getElementsByClassName('read');
			
			if(readEle[readEle.length - 1].nextSibling) {
				currentNode = readEle[readEle.length - 1].nextSibling;
			} else if (readEle[readEle.length - 1].parentNode.nextSibling) {
				currentNode = readEle[readEle.length - 1].parentNode.nextSibling.firstChild.nextSibling;
			} else {
				currentNode = readEle[readEle.length - 1];
			}
			//console.log('currentNode: ' + currentNode.id);
			currentNode.classList.toggle('highlight');
			waveId = 'h' + currentNode.id;
			
			if(waveId in wavesurfer.regions.list) {
				wavesurfer.regions.list[waveId].remove();
			} else {
				wavesurfer.addRegion({
					id: waveId,
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
			
			if(transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight) {
				transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight = false;	
			} else {
				//console.log('initializing');
				transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight = true;
			}

			pastStack.push(['h', currentNode.id]);
		}

		getHighlights();
	},

	'undo': function() {
		var currAction;
		if(pastStack.length > 0) {
			currAction = pastStack.pop()
			futureStack.push(currAction);
			var ele = document.getElementById(currAction[1]);
			var r_i = ele.getAttribute('resultindex');
			var a_i = ele.getAttribute('alternativeindex');
			var w_i = ele.getAttribute('wordindex');
			if( currAction[0] == 'e' ) {
				undoAction = true;
				ele.innerText = currAction[2] + ' ';
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][0] = currAction[2];
			} else if (currAction[0] == 'h' ) {
				ele.classList.toggle('highlight');
				var waveId = 'h' + ele.id;
				if(waveId in wavesurfer.regions.list) {
					wavesurfer.regions.list[waveId].remove();
				} else {
					wavesurfer.addRegion({
						id: waveId,
						start: ele.getAttribute('starttime'),
						end: ele.getAttribute('endtime'),
						color: 'rgba(255, 255, 0, 0.3)',
						drag: false,
						resize: false
					});
				}

				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight) {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight = false;	
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight = true;
				}

				getHighlights();

			} else if (currAction[0] == 's' ) {
				ele.classList.toggle('strike');
				var waveId = 's' + ele.id;
				if(waveId in wavesurfer.regions.list) {
					wavesurfer.regions.list[waveId].remove();
				} else {
					wavesurfer.addRegion({
						id: waveId,
						start: ele.getAttribute('starttime'),
						end: ele.getAttribute('endtime'),
						color: 'rgba(100, 100, 100, 0.5)',
						drag: false,
						resize: false
					});
				}

				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike) {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike = false;	
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike = true;
				}

				getStrikes();
			}
		}
	},

	'redo': function() {
		var currAction;
		if(futureStack.length > 0) {
			currAction = futureStack.pop()
			pastStack.push(currAction);
			var ele = document.getElementById(currAction[1]);
			var r_i = ele.getAttribute('resultindex');
			var a_i = ele.getAttribute('alternativeindex');
			var w_i = ele.getAttribute('wordindex');
			if( currAction[0] == 'e' ) {
				undoAction = true;
				ele.innerText = currAction[3] + ' ';
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][0] = currAction[3];
			} else if (currAction[0] == 'h' ) {
				ele.classList.toggle('highlight');
				var waveId = 'h' + ele.id;
				if(waveId in wavesurfer.regions.list) {
					wavesurfer.regions.list[waveId].remove();
				} else {
					wavesurfer.addRegion({
						id: waveId,
						start: ele.getAttribute('starttime'),
						end: ele.getAttribute('endtime'),
						color: 'rgba(255, 255, 0, 0.3)',
						drag: false,
						resize: false
					});
				}

				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight) {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight = false;	
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].highlight = true;
				}

				getHighlights();

			} else if (currAction[0] == 's' ) {
				ele.classList.toggle('strike');
				var waveId = 's' + ele.id;
				if(waveId in wavesurfer.regions.list) {
					wavesurfer.regions.list[waveId].remove();
				} else {
					wavesurfer.addRegion({
						id: waveId,
						start: ele.getAttribute('starttime'),
						end: ele.getAttribute('endtime'),
						color: 'rgba(100, 100, 100, 0.5)',
						drag: false,
						resize: false
					});
				}

				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike) {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike = false;	
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i].strike = true;
				}

				getStrikes();
			}
		}
	}
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

function saveJSON(filepath, callback) {

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
				paintSilence(start, end);
				silences[start] = Number((end - start).toFixed(1));
			}
		}
	}
}

function getHighlights() {
	var keys = Array();
	for(var i in wavesurfer.regions.list) {
		if(/^h/i.test(i)) {
			keys.push(wavesurfer.regions.list[i]);
		}
	}
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
	for(var i in wavesurfer.regions.list) {
		if(/^s/i.test(i)) {
			keys.push(wavesurfer.regions.list[i]);
		}
	}
	
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

function enableUI() {
	document.getElementById('loader').classList.toggle('spinning');
	document.getElementById('main-container-mask').classList.toggle('invisible');
	setInterval(function() {
		document.getElementById('main-container-mask').setAttribute('style', 'display: none');
		document.getElementById('loading-percentage').innerHTML = '';
	}, 300);
}

function paintSilence(s, e) {
	wavesurfer.addRegion({
		start: s,
		end: e,
		color: 'rgba(255, 0, 0, 0.3)',
		drag: false,
		resize: false
	});
}

function enableInput(caller) {
	wavesurfer.seekTo(caller.id / wavesurfer.getDuration());
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
	var currentSpeaker, nextSpeaker, div, speakerName, word, colonSpan;
	for(var i = 0; i < words.length - 1;) {
		currentSpeaker = speakers[i].speaker;
		nextSpeaker = speakers[i + 1].speaker;
		div = document.createElement('div');
		div.setAttribute('title', currentSpeaker);
		div.setAttribute('contenteditable', 'true');
		div.classList.add('speaker-div');
		speakerName = document.createElement('input');
		//speakerName.innerText = currentSpeaker;
		speakerName.value = currentSpeaker;
		speakerName.classList.add('speaker');
		speakerName.setAttribute('style', 'width: ' + ((speakerName.value.length * 8) + 2) + 'px');
		speakerName.setAttribute('onkeypress', 'resizeInput(this);');
		textArea.appendChild(speakerName);
		colonSpan = document.createElement('input');
		colonSpan.setAttribute('disabled', '');
		colonSpan.value = ": ";
		colonSpan.classList.add('speaker');
		colonSpan.setAttribute('style', 'width: 10px; border: none;');
		div.appendChild(colonSpan);
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
			div.appendChild(word);
			i++;
		} while(currentSpeaker == nextSpeaker && i < words.length - 1);

		textArea.appendChild(div);
	}

	[].forEach.call(document.getElementsByClassName('word'), function(el) {
		el.addEventListener('DOMSubtreeModified', function() {
			var r_i = this.getAttribute('resultindex');
			var a_i = this.getAttribute('alternativeindex');
			var w_i = this.getAttribute('wordindex');
			var oldValue = transcript.results[r_i].alternatives[a_i].timestamps[w_i][0];
			var newValue = this.innerText;
			transcript.results[r_i].alternatives[a_i].timestamps[w_i][0] = newValue;
			if(this.nextSibling) {
				var endTime = this.nextSibling.getAttribute('starttime');
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][2] = endTime;
				this.setAttribute('endtime', endTime);
				this.setAttribute('title', this.getAttribute('starttime') + ' - ' + endTime);
				if(/highlight/i.test(this.classList.value)) {
					GLOBAL_ACTIONS['highlight']();
					GLOBAL_ACTIONS['highlight']();
				}
				if(/strike/i.test(this.classList.value)) {
					GLOBAL_ACTIONS['strike']();
					GLOBAL_ACTIONS['strike']();
				}
			}
			if(!undoAction) {
				pastStack.push(['e', this.id, oldValue, newValue]);
			}

			undoAction = false;
		});
	});
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

function resizeInput(caller) {
	caller.setAttribute('style', 'width: ' + ((caller.value.length * 8) + 2) + 'px');
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
	wavesurfer.load('audio/1.wav');
	loadJSON('transcript/1.json', function(text) {
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
	});

	// startup the page
	wavesurfer.on('ready', function() {
		activeSpeed();
		getSilences();
		fillWords();
		resizeBody();
		enableUI();
	});

	// dummy region ( to startup regions plugin )
	wavesurfer.on('ready', function() {
		wavesurfer.addRegion({
			id: 'dummy',
			start: 0,
			end: 0,
			drag: false,
			resize: false,
			color: 'rgba(255, 255, 0, 0)'
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
	document.addEventListener('keydown', function(e) {
		var map = {
			32: 'play', 		// space
			82: 'rewind', 		// R
			72: 'highlight',	// H
			74: 'strike',		// J
			90: 'undo',			// Z
			83: '', 			// S
		}

		if(e.ctrlKey) {
			var action = map[e.keyCode];
			if(action in GLOBAL_ACTIONS) {
				e.preventDefault();
				if(e.ShiftKey && action == 'undo') {
					GLOBAL_ACTIONS['redo']();
				} else {
					GLOBAL_ACTIONS[action]();
				}
			}
		}
/*
		currentElement = document.activeElement;
		if(currentElement.classList[0] == 'word') {
			if(currentElement.selectionEnd == currentElement.value.length) {
				document.addEventListener('keydown', function(e2) {
					if(e2.keyCode == 39) {
						currentElement.nextSibling.focus();
					}
				});
			}
		}*/
	});
});