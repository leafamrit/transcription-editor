var wavesurfer = Object.create(WaveSurfer);
var transcript;
var wordStarts = Array();
var silences = Array();
var highlights = Array();
var strikes = Array();
var duration;
var takeFromSelection = false;
var currEle;
var lastFocussedInput;

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
		getHighlights();
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
		}
	}
}

// change play pause icon
function togglePlayPause() {
	document.getElementById('playpause').classList.toggle('fa-play');
	document.getElementById('playpause').classList.toggle('fa-pause');
	takeFromSelection = !takeFromSelection;
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
	
	highlights['0'] = Number((keys[0].start).toFixed(1));
	for(var i = 1; i < keys.length - 1; i++) {
		var duration = Number((keys[i + 1].start - keys[i].end).toFixed(1));
		if(duration > 0) {
			highlights[(keys[i].end).toFixed(1)] = duration;
		}
	}
	highlights[keys[i].end.toFixed(1)] = Number((wavesurfer.getDuration() - keys[i].end).toFixed(1));
}

function getStrikes() {
	var keys = Array();
	for(var i in wavesurfer.regions.list) {
		if(/^s/i.test(i)) {
			keys.push(wavesurfer.regions.list[i]);
		}
	}

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
	//lastFocussedInput = caller;
	wavesurfer.seekTo(caller.id / duration);
	//caller.removeAttribute('readonly');
}

function disableInput(caller) {
	caller.setAttribute('readonly', '');
	if(/\s/g.test(caller.value.trim()) && caller.classList[0] != "speaker") {
		var newWords = caller.value.trim().split(' ');
		var parentDiv = caller.parentNode;
		var indexOfCurrentNode = Array.from(parentDiv.children).indexOf(caller);
		var wordDuration = ((caller.getAttribute('endtime') - caller.getAttribute('starttime')) / newWords.length).toFixed(2);
		var newEnd = caller.getAttribute('endtime');
		var newStart = (Number(newEnd) - Number(wordDuration)).toFixed(2);
		var newWord;
		caller.value = newWords[newWords.length - 1];
		caller.setAttribute('starttime', newStart);
		caller.setAttribute('id', newStart);
		caller.setAttribute('title', newStart + " - " + newEnd);
		resizeInput(caller);
		for(var i = newWords.length - 2; i >= 0; i--) {
			newEnd = newStart;
			newStart = (Number(newEnd) - Number(wordDuration)).toFixed(2);
			newWord = document.createElement('input');
			newWord.setAttribute('value', newWords[i]);
			newWord.setAttribute('starttime', newStart);
			newWord.setAttribute('endtime', newEnd);
			newWord.setAttribute('title', newStart + " - " + newEnd);
			newWord.setAttribute('id', newStart);
			newWord.setAttribute('readonly', '');
			newWord.addEventListener('focus', function() { enableInput(this); });
			newWord.addEventListener('blur', function() { disableInput(this); });
			newWord.addEventListener('keypress', function() { resizeInput(this); });
			newWord.classList.add('word');
			resizeInput(newWord);
			parentDiv.insertBefore(newWord, parentDiv.childNodes[indexOfCurrentNode]);
		}
	}
}

function resizeInput(caller) {
	caller.setAttribute('style', 'width: ' + ((caller.value.length + 0.5) * 8) + 'px');
}

function resizeBody() {
	var off = document.getElementsByClassName('main-container')[0].offsetHeight;
	var height = window.innerHeight - off;
	document.getElementsByClassName('transcript-container')[0].setAttribute('style', 'height: ' + height + 'px');
	document.getElementById('text-options').setAttribute('style', 'margin-top: ' + off + 'px');
}

function fillWords() {
	var results = transcript.results;
	var speakers = transcript.speaker_labels;
	var words = Array();
	
	results.forEach(function(result, resultIndex) {
		var maxConfidence = 0;
		var maxAlternative;
		result.alternatives.forEach(function(alternative, alternativeIndex) {
			if(alternative.confidence > maxConfidence) {
				maxAlternative = alternative;
			}
		});
		maxAlternative.timestamps.forEach(function(word, wordIndex) {
			words.push(word);
			wordStarts.push(word[1].toFixed(1));
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
		speakerName = document.createElement('span');
		speakerName.innerText = currentSpeaker + ": ";
		speakerName.classList.add('speaker');
		div.appendChild(speakerName);
		do {
			nextSpeaker = speakers[i + 1].speaker;
			word = document.createElement('span');
			word.innerText = words[i][0] + " ";
			word.setAttribute('starttime', words[i][1]);
			word.setAttribute('endtime', words[i][2]);
			word.setAttribute('title', words[i][1] + " - " + words[i][2]);
			word.setAttribute('tabindex', '-1');
			//word.addEventListener('click', function() { console.log('click'); });
			word.addEventListener('focus', function() { enableInput(this); });
			//word.addEventListener('blur', function() { console.log('blur'); });
			//word.addEventListener('keypress', function() { console.log('keypress'); });
			word.setAttribute('id', words[i][1]);
			word.classList.add('word');
			div.appendChild(word);
			i++;
		} while(currentSpeaker == nextSpeaker && i < words.length - 1);
		textArea.appendChild(div);
	}
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

	wavesurfer.on('ready', function() {
		duration = wavesurfer.getDuration();
		activeSpeed();
		getSilences();
		fillWords();
		resizeBody();
		enableUI();
	});

	// dummy region
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
			90: '', 			// Z
			83: '', 			// S
		}

		if(e.ctrlKey) {
			var action = map[e.keyCode];
			if(action in GLOBAL_ACTIONS) {
				e.preventDefault();
				GLOBAL_ACTIONS[action]();
			}
		}

		currentElement = document.activeElement;
		if(currentElement.classList[0] == 'word') {
			if(currentElement.selectionEnd == currentElement.value.length) {
				document.addEventListener('keydown', function(e2) {
					if(e2.keyCode == 39) {
						currentElement.nextSibling.focus();
					}
				});
			}
		}
	});
});

