var wavesurfer = Object.create(WaveSurfer);

// global variables
var transcript;
var silences = Array();
var highlights = Array();
var strikes = Array();
var pastStack = Array();
var futureStack = Array();
var globaluksp = 0;

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

	'save': function() {
		saveJSON();
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

	'close-find-replace': function() {
		document.getElementById('export-wrapper').classList.add('invisible');
		setTimeout(function() {
			document.getElementById('find-replace-wrapper').classList.add('hidden');
		}, 50);
		[].forEach.call(document.querySelectorAll('.found'), function(el) {
			el.classList.remove('found');
		});
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
				
				pastStack.push(JSON.stringify(transcript));
				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]) {
					if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike) {
						transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
					} else {
						transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
					}
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
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
			
			if(readEle.length <= 0) {
				currentNode = document.getElementsByClassName('word')[0];
			} else if(readEle[readEle.length - 1].nextSibling) {
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

			pastStack.push(JSON.stringify(transcript));
			if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]) {
				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike) {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = false;
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
				}
			} else {
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].strike = true;
			}
		}

		getStrikes();
	},

	'highlight': function() {
		//console.log(window.getSelection + " " + window.getSelection().toString().split('').length);
		if(window.getSelection && window.getSelection().toString().split('').length > 1) {
			//console.log('condition 1 active');
			var startElement = window.getSelection().anchorNode.parentElement;
			while(startElement.classList[0] != 'word') {
				startElement = startElement.nextSibling;
			}
			//console.log('startElement: ' + startElement.id)
			var endElement = window.getSelection().extentNode.parentElement;
			while(endElement.classList[0] != 'word') {
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
				
				pastStack.push(JSON.stringify(transcript));
				//console.log(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]);
				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]) {
					//console.log('predefined');
					if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight) {
						transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
					} else {
						transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
					}
				} else {
					//console.log('defining');
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
					//console.log(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]);
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
			
			if(readEle.length <= 0) {
				currentNode = document.getElementsByClassName('word')[0];
			} else if(readEle[readEle.length - 1].nextSibling) {
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
			
			pastStack.push(JSON.stringify(transcript));
			//console.log(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]);
			if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]) {
				//console.log('predefined');
				if(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight) {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = false;
				} else {
					transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
				}
			} else {
				//console.log('defining');
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][3] = {};
				transcript.results[r_i].alternatives[a_i].timestamps[w_i][3].highlight = true;
				//console.log(transcript.results[r_i].alternatives[a_i].timestamps[w_i][3]);
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
			//console.log(transcript);
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

function saveJSON() {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState === 4 && this.status === 200) {
			console.log(this.responseText);
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
				paintSilence(start, end);
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

		});
	});

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

function changeInput(caller) {
	var input = caller.value;
	var oldName = caller.getAttribute('speakername');
	pastStack.push(JSON.stringify(transcript));
	var inputLength = (caller.value.length * 8) + 30;
	console.log(input + ' ' + oldName);
	pastStack.push(JSON.stringify(transcript));
	
	if(!caller.value || caller.value.trim() == '') {
		caller.value = 'Unknown Speaker ' + (globaluksp++);
		var startIndex = caller.getAttribute('speakerindex');
		var endIndex = caller.nextSibling.nextSibling.nextSibling ? Number(caller.nextSibling.nextSibling.nextSibling.getAttribute('speakerindex')) : transcript.speaker_labels.length;
		console.log(startIndex + ' ' + endIndex);

		for(var i = startIndex; i < endIndex; i++) {
			transcript.speaker_labels[i].speaker = caller.value;
		}
	} else {
		transcript.speaker_labels.forEach(function(el) {
			if(el.speaker == oldName) {
				el.speaker = input;
			}
		});

		var speakerList = document.getElementById('speakerlist');
		datalistOption = document.createElement('option');
		datalistOption.value = input;
		speakerList.appendChild(datalistOption);
	}

	fillWords();
}

/*function showSpeakerForm(caller, event) {
	var ele = document.getElementById('speakerlabel-wrapper');
	ele.setAttribute('style', 'top: ' + event.clientY + 'px; left: ' + event.clientX + 'px;');
	ele.classList.remove('hidden');
	setTimeout(function() {
		ele.classList.remove('invisible');
	}, 50);

	document.getElementById('speakerid').value = caller.id;
}*/

function handleList(caller) {
	caller.value = '';
}

function handleValue(caller) {
	if(!caller.value || caller.value.trim() == '') {
		pastStack.push(JSON.stringify(transcript));
		caller.value = caller.getAttribute('speakername');
		/*var speakers = document.getElementsByClassName('speaker');*/
		/*var inputLength = (caller.value.length * 8) + 30;*/
		/*var input = caller.value;
		var startIndex = caller.getAttribute('speakerindex');
		var endIndex = caller.nextSibling.nextSibling.nextSibling ? Number(caller.nextSibling.nextSibling.nextSibling.getAttribute('speakerindex')) : transcript.speaker_labels.length;
		console.log(startIndex + ' ' + endIndex);
		var oldName = caller.getAttribute('speakername');*/

		/*[].forEach.call(document.querySelectorAll('.speaker'), function(el) {
			if(el.getAttribute('speakername') ==  oldName) {
				el.value = input;
				el.setAttribute('style', 'width: ' + inputLength + 'px');
				el.setAttribute('speakername', input);
			}
		});*/

		/*transcript.speaker_labels.forEach(function(el) {
			if(el.speaker == oldName) {
				el.speaker = input;
			}
		});*/

		/*for(var i = startIndex; i < endIndex; i++) {
			transcript.speaker_labels[i].speaker = '';
		}

		fillWords();*/
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
		document.getElementById('loading-text').innerHTML = 'Loading audio clip...';
		setTimeout(function() {
			document.getElementById('loading-text').innerHTML = 'Doing some math...';
		}, 2000);
		setTimeout(function() {
			document.getElementById('loading-text').innerHTML = 'This only happens the first time...';
		}, 2000);
		setTimeout(function() {
			document.getElementById('loading-text').innerHTML = 'Really...';
		}, 2000);
	});

	// startup the page
	wavesurfer.on('ready', function() {
		activeSpeed();
		getSilences();
		fillWords();
		[].forEach.call(document.querySelectorAll('.speaker'), function(el) {
			if(/Unknown Speaker/i.test(el.value)) {
				globaluksp++;
			}
		});
		resizeBody();
		enableUI();
		setInterval(function() {
			saveJSON();
		}, 30000)
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
	var shortcutWrapper = document.getElementById('shortcut-wrapper');
	var shift_key = document.getElementById('shift-key');
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
					extra_key.innerHTML = e.key.toUpperCase();
					extra_key.classList.remove('hidden');
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
		[].forEach.call(document.querySelectorAll('.word'), function(el) {
			if(el.innerText.search(foundWord) >= 0) {
				el.innerText = el.innerText.replace(foundWord, replaceWord);
			}
		});
		document.getElementById('find-replace-wrapper').classList.add('hidden');
		setTimeout(function() {
			[].forEach.call(document.querySelectorAll('.found'), function(el) {
				el.classList.remove('found');
			});
		}, 1000);
	});

});