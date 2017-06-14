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
var saved = false;

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
		if(window.getSelection && window.getSelection().toString().split('').length > 1) {
			var startElement = window.getSelection().baseNode.parentElement;
			if(startElement.classList[0] != 'word') {
				startElement = startElement.nextSibling;
			}
			var endElement = window.getSelection().extentNode.parentElement;
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
				
				pastStack.push(JSON.stringify(transcript));
				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]) {
					if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike) {
						transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
					} else {
						transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
						transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
					}
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
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

			pastStack.push(JSON.stringify(transcript));
			if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]) {
				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike) {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
				}
			} else {
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
			}
		}

		getStrikes();
	},

	'highlight': function() {
		if(window.getSelection && window.getSelection().toString().split('').length > 1) {
			var startElement = window.getSelection().baseNode.parentElement;
			while(startElement.classList[0] != 'word') {
				startElement = startElement.nextSibling;
			}
			var endElement = window.getSelection().extentNode.parentElement;
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
				
				pastStack.push(JSON.stringify(transcript));
				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]) {
					if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight) {
						transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
					} else {
						transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
						transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
					}
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
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
			
			pastStack.push(JSON.stringify(transcript));
			if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]) {
				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight) {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
				}
			} else {
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
			}
		}

		getHighlights();
	},

	'undo': function() {
		var currAction;
		if(pastStack.length > 0) {
			futureStack.push(JSON.stringify(transcript));
			currAction = pastStack.pop()
			transcript = {};
			transcript = JSON.parse(currAction);
			fillWords();
			readWords();
		}
	},

	'redo': function() {
		var currAction;
		if(futureStack.length > 0) {
			pastStack.push(JSON.stringify(transcript));
			currAction = futureStack.pop()
			transcript = JSON.parse(currAction);
			fillWords();
			readWords();
		}
	}
}

function setCookie(key, value) {
	var d = new Date();
	d.setTime(d.getTime() + 2592000000);
	document.cookie = key + '=' + value + '; expires=' + d.toUTCString() + '; path=/';
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

function saveJSON(alertUser) {
	saved = false;
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
	xhttp.open('POST', './test.php', true);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.send('transcript=' + JSON.stringify(transcript));
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
				//paintSilence(start, end);
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
	document.getElementById('help-wrapper').setAttribute('style', 'top: ' + off + 'px');
}

// fill editor with words from database
function fillWords() {
	var results = transcript.results;
	var speakers = transcript.speaker_labels;
	var words = Array();
	var toReach = Array();
	var i = 0;
	var maxAlternativeIndex;
	
	var textArea = document.getElementById('transcript-area');
	var datalist = document.getElementById('speakerlist');
	while(textArea.hasChildNodes()) {
		textArea.removeChild(textArea.lastChild);
	}
	textArea.appendChild(datalist);
	
	results.forEach(function(result, resultIndex) {
		var maxConfidence = 0;
		var maxAlternative;
		result.alternatives.forEach(function(alternative, alternativeIndex) {
			if(alternative.confidence > maxConfidence) {
				maxAlternative = alternative;
				maxAlternativeIndex = alternativeIndex;
			}
		});
		var currentSpeaker, prevSpeaker, div, speakerName, currWord;
		maxAlternative.timestamps.forEach(function(word, wordIndex) {
			currentSpeaker = speakers[i++].speaker;
			if(currentSpeaker != prevSpeaker) {
				if(div) {
					textArea.appendChild(div);
					var specialBreak = document.createElement('br');
					specialBreak.classList.add('special-break');
					textArea.appendChild(specialBreak);
				}
				div = document.createElement('div');
				div.setAttribute('title', currentSpeaker);
				div.setAttribute('contenteditable', 'true');
				div.classList.add('speaker-div');
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
			currWord = document.createElement('span');
			currWord.innerText = word[0] + " ";
			currWord.setAttribute('starttime', word[1]);
			currWord.setAttribute('endtime', word[2]);
			currWord.setAttribute('resultindex', resultIndex);
			currWord.setAttribute('alternativeindex', maxAlternativeIndex);
			currWord.setAttribute('wordindex', wordIndex);
			currWord.setAttribute('title', word[1] + " - " + word[2]);
			currWord.setAttribute('tabindex', '-1');
			currWord.addEventListener('focus', function() { enableInput(this); });
			currWord.setAttribute('id', word[1]);
			currWord.classList.add('word');
			var hWaveId = 'h' + word[1];
			var sWaveId = 's' + word[1];
			if(word[3]) {
				if(word[3].highlight) {
					currWord.classList.add('highlight');
					if(hWaveId in wavesurfer.regions.list) {

					} else {
						wavesurfer.addRegion({
							id: hWaveId,
							start: currWord.getAttribute('starttime'),
							end: currWord.getAttribute('endtime'),
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
			if(word[3]) {
				if(word[3].strike) {
					currWord.classList.add('strike');
					if(sWaveId in wavesurfer.regions.list) {

					} else {
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
					if(sWaveId in wavesurfer.regions.list) {
						wavesurfer.regions.list[sWaveId].remove();
					}
				}
			} else {
				if(sWaveId in wavesurfer.regions.list) {
					wavesurfer.regions.list[sWaveId].remove();
				}
			}
			div.appendChild(currWord);
			prevSpeaker = currentSpeaker;
		});
		textArea.appendChild(div);
		var specialBreak = document.createElement('br');
		specialBreak.classList.add('special-break');
		textArea.appendChild(specialBreak);
	});

	[].forEach.call(document.getElementsByClassName('word'), function(el) {
		el.addEventListener('DOMSubtreeModified', function() {
			if(!undoAction) {
				pastStack.push(JSON.stringify(transcript));
			}
			undoAction = false;
			var r_i = this.getAttribute('resultindex');
			var a_i = this.getAttribute('alternativeindex');
			var w_i = this.getAttribute('wordindex');
			var oldValue = transcript.results[r_i].alternatives[a_i].timestamps[w_i][0];
			var newValue = this.innerText;
			var newTranscript = '';
			transcript.results[r_i].alternatives[a_i].timestamps[w_i][0] = newValue;
			transcript.results[r_i].alternatives[a_i].timestamps.forEach(function(word) {
				newTranscript += word[0] + ' ';
			});
			transcript.results[r_i].alternatives[a_i].transcript = newTranscript;
			var endTime, startTime;
			if(this == this.parentElement.firstChild) {
				if(r_i === '0') {
					startTime = '0';
				} else if(w_i === '0') {
					var pre_r_i = Number(r_i) - 1;
					var pre_index = transcript.results[pre_r_i].alternatives[0].timestamps - 1;
					startTime = transcript.results[pre_r_i].alternatives[0].timestamps[pre_index][2];
				}
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][1] = startTime;
				this.setAttribute('starttime', startTime);
				this.id = startTime;
				this.setAttribute('title', startTime + ' - ' + this.getAttribute('endtime'));
			} else if(this.nextSibling) {
				endTime = this.nextSibling.getAttribute('starttime');
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][2] = endTime;
				this.setAttribute('endtime', endTime);
				this.setAttribute('title', this.getAttribute('starttime') + ' - ' + endTime);
			}
			if(/highlight/i.test(this.classList.value)) {
				GLOBAL_ACTIONS['highlight']();
				GLOBAL_ACTIONS['highlight']();
			}
			if(/strike/i.test(this.classList.value)) {
				GLOBAL_ACTIONS['strike']();
				GLOBAL_ACTIONS['strike']();
			}

		});
	});

	getHighlights();
	getStrikes();
}

function readWords() {
	[].forEach.call(document.getElementsByClassName('word'), function(el) {
		if( el.id < wavesurfer.getCurrentTime() ) {
			el.classList.add('read');
			var divEnds = document.getElementById('transcript-area').getBoundingClientRect();
			if(divEnds.bottom < el.getBoundingClientRect().bottom || divEnds.top > el.getBoundingClientRect().top) {
				el.scrollIntoView();
			}
		} else {
			el.classList.remove('read');
		}
	});
}

function changeInput(caller) {
	if(!caller.value || caller.value.trim() == '') {
		changed = false;
		caller.value = 'Unknown Speaker ' + (globaluksp++);
		var startIndex = caller.getAttribute('speakerindex');
		var endIndex = caller.nextSibling.nextSibling.nextSibling ? Number(caller.nextSibling.nextSibling.nextSibling.getAttribute('speakerindex')) : transcript.speaker_labels.length;

		for(var i = startIndex; i < endIndex; i++) {
			transcript.speaker_labels[i].speaker = caller.value;
		}
	} else {
		var input = caller.value;
		var oldName = caller.getAttribute('speakername');
		pastStack.push(JSON.stringify(transcript));
		var inputLength = (caller.value.length * 8) + 30;
		transcript.speaker_labels.forEach(function(el) {
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
		var endIndex = caller.nextSibling.nextSibling.nextSibling ? Number(caller.nextSibling.nextSibling.nextSibling.getAttribute('speakerindex')) : transcript.speaker_labels.length;

		for(var i = startIndex; i < endIndex; i++) {
			transcript.speaker_labels[i].speaker = caller.value;
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

window.onbeforeunload = function(e) {
	e || window.event;
	if(e) {
		return '';
	}
	return '';
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
		backend: 'AudioElement',
		height: 95
	};

	wavesurfer.init(options);

	var peaks = [0.0096435546875,0.05340576171875,0.07263405621051788,0.06436353921890259,0.241912841796875,0.3318277597427368,0.19684438407421112,0.321197509765625,0.3013092577457428,0.22586749494075775,0.16815698146820068,0.22461622953414917,0.2526627480983734,0.25778985023498535,0.187103271484375,0.25696584582328796,0.280792236328125,0.28769800066947937,0.21683400869369507,0.24749755859375,0.2920621335506439,0.309967041015625,0.2842493951320648,0.179901123046875,0.182525634765625,0.16125980019569397,0.22788171470165253,0.1231689453125,0.27239990234375,0.3322855234146118,0.22873622179031372,0.31298828125,0.350555419921875,0.14136174321174622,0.08227790147066116,0.07061767578125,0.10943603515625,0.16360972821712494,0.14963224530220032,0.12137211114168167,0.079287089407444,0.0484619140625,0.041046142578125,0.20160527527332306,0.22547075152397156,0.167144775390625,0.21021148562431335,0.1027253046631813,0.10391552746295929,0.02069154940545559,0.008362071588635445,0.009216589853167534,0.0045166015625,0.006714072078466415,0.032806396484375,0.08447523415088654,0.13287758827209473,0.05145263671875,0.10162353515625,0.06576738506555557,0.03973388671875,0.06744384765625,0.0111083984375,0.012481689453125,0.007415771484375,0.007659912109375,0.008575439453125,0.05410931631922722,0.168304443359375,0.149139404296875,0.1270485520362854,0.04119873046875,0.024781029671430588,0.014831995591521263,0.012207403779029846,0.010864589363336563,0.009857177734375,0.008117923513054848,0.054353464394807816,0.07348857074975967,0.11648914963006973,0.06933805346488953,0.08606219291687012,0.037568286061286926,0.1083984375,0.03894161805510521,0.19373150169849396,0.030610065907239914,0.060760498046875,0.06497390568256378,0.016143798828125,0.006988738663494587,0.00982666015625,0.01739501953125,0.03726309910416603,0.10162353515625,0.19403667747974396,0.21826837956905365,0.2532958984375,0.170440673828125,0.2093505859375,0.1823175698518753,0.14871670305728912,0.193450927734375,0.2066650390625,0.1282958984375,0.09210205078125,0.123321533203125,0.123291015625,0.09317301213741302,0.060791015625,0.320892333984375,0.30439162254333496,0.3268837630748749,0.095245361328125,0.039704579859972,0.040557861328125,0.02679443359375,0.03894161805510521,0.0789513811469078,0.173858642578125,0.089813232421875,0.15668202936649323,0.104339599609375,0.18030335009098053,0.0635700523853302,0.039398193359375,0.06753746420145035,0.046142578125,0.009765625,0.007568359375,0.005401776172220707,0.1837214231491089,0.197052001953125,0.209808349609375,0.214691162109375,0.109466552734375,0.1904296875,0.127227783203125,0.21585741639137268,0.204071044921875,0.1987365335226059,0.19467757642269135,0.243865966796875,0.26743370294570923,0.06051820516586304,0.05868709459900856,0.02783203125,0.03851318359375,0.293609619140625,0.27960205078125,0.35370951890945435,0.08789330720901489,0.10184026509523392,0.10696737468242645,0.099151611328125,0.182708740234375,0.21634571254253387,0.02294921875,0.023285623639822006,0.032135989516973495,0.036072880029678345,0.039306640625,0.047149658203125,0.0711691677570343,0.143951416015625,0.14788818359375,0.22894985973834991,0.185455322265625,0.12985625863075256,0.099639892578125,0.126434326171875,0.222869873046875,0.4122440218925476,0.39373779296875,0.33685302734375,0.23688466846942902,0.22088623046875,0.3093966543674469,0.1649169921875,0.231964111328125,0.22808837890625,0.300567626953125,0.089752197265625,0.12469863146543503,0.20432141423225403,0.122955322265625,0.1515854299068451,0.44090089201927185,0.3394775390625,0.17963194847106934,0.23947873711585999,0.400909423828125,0.3905758857727051,0.47087007761001587,0.42591631412506104,0.5131077170372009,0.269508957862854,0.220489501953125,0.205291748046875,0.15469832718372345,0.2601092457771301,0.11270485818386078,0.158635213971138,0.47334209084510803,0.285888671875,0.23297829926013947,0.20496231317520142,0.33585619926452637,0.36492919921875,0.4618366062641144,0.108154296875,0.06732177734375,0.08075197786092758,0.10125732421875,0.11761833727359772,0.147796630859375,0.09332275390625,0.23603014647960663,0.137298583984375,0.1434326171875,0.08929716050624847,0.17813654243946075,0.17404705286026,0.152313232421875,0.11587878316640854,0.1193273738026619,0.09305093437433243,0.07003998011350632,0.085540771484375,0.046905517578125,0.06054872274398804,0.07794427126646042,0.10092470794916153,0.03881954401731491,0.055419921875,0.0635395348072052,0.03515625,0.0637531653046608,0.04202398657798767,0.04818872734904289,0.24411755800247192,0.30430006980895996,0.1673024743795395,0.10925626754760742,0.047059543430805206,0.020935697481036186,0.01916562393307686,0.014007568359375,0.1112704873085022,0.03179931640625,0.11468856036663055,0.027344584465026855,0.01263427734375,0.0289306640625,0.19394512474536896,0.02551347389817238,0.046478271484375,0.04934842884540558,0.055938720703125,0.048919677734375,0.005218505859375,0.0062255859375,0.012908935546875,0.018799401819705963,0.011016845703125,0.016235847026109695,0.01104770042002201,0.00634765625,0.004455702379345894,0.003936767578125,0.003479110077023506,0.002960205078125,0.0027161473408341408,0.0044862208887934685,0.030671101063489914,0.040191650390625,0.0476088747382164,0.0732421875,0.006683349609375,0.005493331700563431,0.006134033203125,0.01885986328125,0.04416028410196304,0.04583880305290222,0.04834131896495819,0.06732383370399475,0.03106689453125,0.028382213786244392,0.07110595703125,0.06506545841693878,0.061676025390625,0.056304931640625,0.031464584171772,0.0482177734375,0.08062990009784698,0.08795434236526489,0.037690360099077225,0.17938232421875,0.163177490234375,0.5123752355575562,0.298248291015625,0.10076904296875,0.127777099609375,0.12030396610498428,0.0713827908039093,0.0518798828125,0.11169774830341339,0.087738037109375,0.097320556640625,0.12854395806789398,0.07312235236167908,0.0780029296875,0.105224609375,0.110260009765625,0.161285400390625,0.1837158203125,0.07403790205717087,0.084503173828125,0.13364055752754211,0.10186767578125,0.139373779296875,0.1260986328125,0.136260986328125,0.029816582798957825,0.03192138671875,0.0040894802659749985,0.07779168337583542,0.1354106217622757,0.07080078125,0.06512650102376938,0.05471968650817871,0.07858516275882721,0.21356201171875,0.039155248552560806,0.059844970703125,0.08319091796875,0.07599108666181564,0.102142333984375,0.009674367494881153,0.00653076171875,0.007385479286313057,0.011627197265625,0.0064697265625,0.006134220398962498,0.010162353515625,0.007477034814655781,0.0028077028691768646,0.024993896484375,0.09332560002803802,0.179290771484375,0.049530029296875,0.010894775390625,0.0042420728132128716,0.138824462890625,0.18668171763420105,0.089752197265625,0.063081756234169,0.00738525390625,0.006988525390625,0.006256294436752796,0.003265480510890484,0.005798516795039177,0.008758812211453915,0.009247108362615108,0.019379254430532455,0.10541093349456787,0.1356852948665619,0.010589922778308392,0.011474609375,0.0031128879636526108,0.0068359375,0.005279541015625,0.008178960531949997,0.0054322946816682816,0.005157470703125,0.005890072323381901,0.29254150390625,0.21289712190628052,0.137786865234375,0.06610309332609177,0.15677358210086823,0.17840576171875,0.0484619140625,0.023712158203125,0.022125244140625,0.113372802734375,0.23432111740112305,0.06265450268983841,0.10486160218715668,0.23670156300067902,0.20010986924171448,0.023468732833862305,0.1432233601808548,0.07461775839328766,0.08395642042160034,0.011871700175106525,0.005401776172220707,0.0066225165501236916,0.0101318359375,0.00918607134371996,0.0048829615116119385,0.005706787109375,0.005584716796875,0.07840204983949661,0.15390484035015106,0.204559326171875,0.20159912109375,0.154632568359375,0.07364116609096527,0.143402099609375,0.14385986328125,0.151275634765625,0.1350444108247757,0.026367992162704468,0.01043701171875,0.012390514835715294,0.01409912109375,0.02948088012635708,0.079409159719944,0.18756103515625,0.06628620624542236,0.19199194014072418,0.22559282183647156,0.15695668756961823,0.2558977007865906,0.15701773762702942,0.16278572380542755,0.1432233601808548,0.27490234375,0.04205322265625,0.0242919921875,0.033599853515625,0.08294931054115295,0.16037476062774658,0.17087313532829285,0.2847987413406372,0.32862329483032227,0.20288705825805664,0.341705322265625,0.27994629740715027,0.255340576171875,0.3431501090526581,0.206146240234375,0.20453505218029022,0.4111148416996002,0.17133091390132904,0.0225830078125,0.223358154296875,0.245513916015625,0.13153477013111115,0.24280525743961334,0.044036865234375,0.28226569294929504,0.151336669921875,0.222930908203125,0.062990203499794,0.140411376953125,0.27500230073928833,0.251190185546875,0.4040955901145935,0.12256233394145966,0.299417108297348,0.292633056640625,0.17007964849472046,0.202301025390625,0.2072817087173462,0.28973388671875,0.3966185450553894,0.326629638671875,0.10669270902872086,0.3728141188621521,0.1423688530921936,0.1344035118818283,0.058135986328125,0.06738486886024475,0.03271484375,0.282806396484375,0.24725341796875,0.11993408203125,0.02050843834877014,0.03799554333090782,0.01397705078125,0.013336181640625,0.01309244055300951,0.013336588628590107,0.006683553569018841,0.006591796875,0.00515762809664011,0.109771728515625,0.16092410683631897,0.014801477082073689,0.012115848250687122,0.015289306640625,0.0074462890625,0.0081787109375,0.00833155307918787,0.006500244140625,0.181610107421875,0.20928955078125,0.11688232421875,0.16412854194641113,0.095428466796875,0.01641845703125,0.011230811476707458,0.009033478796482086,0.0477004311978817,0.226776123046875,0.1264687031507492,0.1498764008283615,0.028260139748454094,0.0130615234375,0.013763847760856152,0.03305154666304588,0.104339599609375,0.04974365234375,0.047120578587055206,0.0946379005908966,0.10486160218715668,0.155029296875,0.15430158376693726,0.066131591796875,0.0795922726392746,0.11954100430011749,0.146942138671875,0.1739501953125,0.1109958216547966,0.151397705078125,0.03894161805510521,0.02072206884622574,0.02304147556424141,0.2292550504207611,0.071441650390625,0.184783935546875,0.24179814755916595,0.113037109375,0.05572509765625,0.06103515625,0.109527587890625,0.156768798828125,0.15695668756961823,0.15997314453125,0.21884822845458984,0.13797418773174286,0.18975830078125,0.26520586013793945,0.21616260707378387,0.13180944323539734,0.1515549123287201,0.07049560546875,0.042633056640625,0.09741508215665817,0.1151123046875,0.07574693858623505,0.05844294652342796,0.085479736328125,0.04815673828125,0.08902249485254288,0.10965300351381302,0.0792260468006134,0.037322998046875,0.06448560953140259,0.06707968562841415,0.052888575941324234,0.0949736014008522,0.07958984375,0.050384521484375,0.04254150390625,0.11575670540332794,0.11194188892841339,0.14056396484375,0.08404797315597534,0.126194030046463,0.11438336968421936,0.1075439453125,0.0850830078125,0.145233154296875,0.1842041015625,0.158482626080513,0.17069002985954285,0.12548828125,0.10748291015625,0.210205078125,0.17010498046875,0.223358154296875,0.20379638671875,0.146087646484375,0.206207275390625,0.2137821614742279,0.14544677734375,0.06103701889514923,0.048370361328125,0.11688232421875,0.1274452954530716,0.17035432159900665,0.059877313673496246,0.08905029296875,0.10858154296875,0.16364024579524994,0.06750693917274475,0.01116977445781231,0.007507553324103355,0.0198370311409235,0.042694091796875,0.04614398628473282,0.053498946130275726,0.182525634765625,0.0914306640625,0.15652944147586823,0.10440382361412048,0.11597033590078354,0.109100341796875,0.1275673657655716,0.12930692732334137,0.089019775390625,0.1148681640625,0.0796533077955246,0.13773003220558167,0.07663197815418243,0.05331583693623543,0.05853271484375,0.13898129761219025,0.0795312374830246,0.006866455078125,0.014190673828125,0.05596923828125,0.12143314629793167,0.122711181640625,0.11673329770565033,0.045501708984375,0.020172119140625,0.12664794921875,0.17633056640625,0.1265297383069992,0.015106662176549435,0.017883846536278725,0.0543212890625,0.23703725636005402,0.05804443359375,0.011078218929469585,0.012146366760134697,0.021637622267007828,0.0197149571031332,0.02923583984375,0.029969176277518272,0.1800537109375,0.2305673360824585,0.08740234375,0.11194188892841339,0.1902523934841156,0.089447021484375,0.11114501953125,0.022979736328125,0.01422162540256977,0.011077880859375,0.04580828174948692,0.10147404670715332,0.090057373046875,0.091094970703125,0.05596923828125,0.035279396921396255,0.012329477816820145,0.007721182890236378,0.0133056640625,0.12115478515625,0.12561418116092682,0.2054443359375,0.12063966691493988,0.0316782146692276,0.01660206913948059,0.014557329006493092,0.0133056640625,0.00762939453125,0.009918212890625,0.002960205078125,0.050201416015625,0.08532975614070892,0.098541259765625,0.11438336968421936,0.17648853361606598,0.168609619140625,0.116729736328125,0.18826869130134583,0.009949034079909325,0.00753807183355093,0.00787377543747425,0.0133056640625,0.011383404023945332,0.010406494140625,0.06109619140625,0.2792138457298279,0.11770989000797272,0.13714599609375,0.021942138671875,0.014404296875,0.021942138671875,0.21106600761413574,0.127716064453125,0.08136234432458878,0.06494140625,0.01760917901992798,0.01806640625,0.0054322946816682816,0.010406811721622944,0.1119384765625,0.111053466796875,0.10419019311666489,0.13892024755477905,0.095736563205719,0.02697836235165596,0.00872802734375,0.00543212890625,0.005706961266696453,0.048065185546875,0.04574724659323692,0.06604205071926117,0.055328369140625,0.14026306569576263,0.04669331759214401,0.09149449318647385,0.082763671875,0.02630615234375,0.013000885024666786,0.0064699240028858185,0.007415771484375,0.0074462890625,0.01220703125,0.015686513856053352,0.01742606982588768,0.069183349609375,0.13785210251808167,0.105194091796875,0.12085329741239548,0.0430908203125,0.100830078125,0.11209448426961899,0.08721923828125,0.018524736166000366,0.03204345703125,0.00909423828125,0.092987060546875,0.11480712890625,0.053863525390625,0.11310159415006638,0.1060791015625,0.06262397766113281,0.12186040729284286,0.034912109375,0.09103671461343765,0.091339111328125,0.06906338781118393,0.036956787109375,0.024414807558059692,0.01355021819472313,0.01025421917438507,0.085418701171875,0.09588915854692459,0.10577392578125,0.127532958984375,0.106048583984375,0.17810602486133575,0.191503643989563,0.080963134765625,0.0874050110578537,0.11795403808355331,0.042572021484375,0.19256591796875,0.2539445161819458,0.011810302734375,0.007690664380788803,0.012725830078125,0.010864589363336563,0.008880886249244213,0.011413922533392906,0.01071199681609869,0.1576281040906906,0.15607166290283203,0.050445556640625,0.19699697196483612,0.14716024696826935,0.07492294162511826,0.09796441346406937,0.1611328125,0.093780517578125,0.1448974609375,0.15069580078125,0.122955322265625,0.09717093408107758,0.184051513671875,0.022186279296875,0.0091552734375,0.023163549602031708,0.21148681640625,0.17877197265625,0.053924560546875,0.016876220703125,0.014190673828125,0.01110873743891716,0.245025634765625,0.23166599869728088,0.169189453125,0.1821039468050003,0.102569580078125,0.0703125,0.0201416015625,0.12384033203125,0.23681640625,0.13943907618522644,0.110443115234375,0.21295815706253052,0.130828857421875,0.031524658203125,0.040679931640625,0.03265480697154999,0.03317362070083618,0.10910367220640182,0.2946562170982361,0.093505859375,0.29721975326538086,0.190673828125,0.25225830078125,0.22283935546875,0.14120914041996002,0.2518310546875,0.03057861328125,0.041749320924282074,0.31427961587905884,0.21042512357234955,0.24152348935604095,0.050079345703125,0.2952055335044861,0.021728515625,0.0091552734375,0.005859375,0.004669189453125,0.0056764427572488785,0.04498291015625,0.07092501223087311,0.221893310546875,0.2133854180574417,0.006164738908410072,0.00433349609375,0.003509521484375,0.018218994140625,0.07715079188346863,0.093292236328125,0.044984281063079834,0.005371257662773132,0.003326517529785633,0.002349853515625,0.001861572265625,0.110504150390625,0.0933837890625,0.13782158493995667,0.31671142578125,0.204742431640625,0.049591064453125,0.02783288061618805,0.01495361328125,0.106292724609375,0.131134033203125,0.22515869140625,0.01043701171875,0.03314310312271118,0.158543661236763,0.1347087025642395,0.2854396104812622,0.16559343039989471,0.11816766858100891,0.011078218929469585,0.005127109587192535,0.0046388134360313416,0.004638671875,0.0027466658502817154,0.0025635547935962677,0.110934779047966,0.0751953125,0.08163700997829437,0.007629627361893654,0.00830078125,0.144073486328125,0.22137451171875,0.09363079071044922,0.09131138026714325,0.054292429238557816,0.03118896484375,0.083465576171875,0.100860595703125,0.024627685546875,0.04052858054637909,0.045989990234375,0.24335458874702454,0.124755859375,0.04589983820915222,0.04452650621533394,0.07318338751792908,0.021392822265625,0.02923673205077648,0.004058961756527424,0.004241943359375,0.00357066560536623,0.060333251953125,0.290435791015625,0.096710205078125,0.1336669921875,0.12839137017726898,0.14819788932800293,0.11188085377216339,0.06756591796875,0.025238037109375,0.022064208984375,0.058319091796875,0.05233924463391304,0.037384033203125,0.005218665115535259,0.0040894802659749985,0.005340576171875,0.003631591796875,0.0037537766620516777,0.002868739888072014,0.00347900390625,0.0795312374830246,0.10925626754760742,0.06259346008300781,0.004302978515625,0.004364013671875,0.02386547438800335,0.06607257574796677,0.145477294921875,0.2916959226131439,0.22028259932994843,0.23557236790657043,0.667388916015625,0.228179931640625,0.20792260766029358,0.155364990234375,0.210723876953125,0.15869140625,0.2211676388978958,0.18808557093143463,0.4185308516025543,0.19418928027153015,0.16559343039989471,0.12097537517547607,0.10150456428527832,0.09738456457853317,0.08517716079950333,0.261260986328125,0.17188024520874023,0.11032441258430481,0.2528153359889984,0.239013671875,0.0870361328125,0.0869167149066925,0.15698722004890442,0.04361094906926155,0.05627613142132759,0.019561767578125,0.02239990234375,0.01815851405262947,0.021453857421875,0.012665181420743465,0.03012176975607872,0.023712158203125,0.01654052734375,0.0152587890625,0.027954954653978348,0.03497314453125,0.039338357746601105,0.03961181640625,0.02630615234375,0.025848388671875,0.020447401329874992,0.03472900390625,0.015411376953125,0.019317626953125,0.026275634765625,0.02044677734375,0.028901029378175735,0.017151402309536934,0.03839228302240372,0.019775390625,0.02728271484375,0.016327403485774994,0.021973326802253723,0.03320413827896118,0.03872798755764961,0.02307199314236641,0.026611328125,0.0330810546875,0.032623291015625,0.03234962001442909,0.035309914499521255,0.04156620800495148,0.025086214765906334,0.0025025177747011185,0.000244140625,0,0,0]
	// load audio
	wavesurfer.load('audio/3.wav', peaks, 'none');
	loadJSON('transcript/3.json', function(text) {
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
		wavesurfer.addRegion({
			id: 'dummy',
			start: 0,
			end: 0,
			drag: false,
			resize: false,
			color: 'rgba(255, 255, 0, 0)'
		});
		resizeBody();
		if(/hints=off/i.test(document.cookie)) {
			GLOBAL_ACTIONS['toggle-hints']();
		}
		enableUI();
		[].forEach.call(document.querySelectorAll('.speaker'), function(el) {
			if(/Unknown Speaker/i.test(el.value)) {
				globaluksp++;
			}
		});
		activeSpeed();
		//getSilences();
		fillWords();
		setInterval(function() {
			saveJSON(false);
		}, 30000)
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
			32: 'play', 		// space
			82: 'rewind', 		// R
			72: 'highlight',	// H
			74: 'strike',		// J
			90: 'undo',			// Z
			83: 'save', 		// S
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