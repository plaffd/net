/*

various scripts to add extra functionality to webpage

*/

const t1 = Date.now();

// ################################################################
// ################################################################
//							FOOTNOTE POPUPS
// ################################################################
// ################################################################

// footnote popups setting
const fntoggle = document.getElementById("toggle-popup-footnotes");

fntoggle.addEventListener("click", () => {
	if (fntoggle.textContent == "Jumplink Footnotes") {
		changeFootnoteRefClickAction("jumplink");
		fntoggle.textContent = "Modal Footnotes";
	} else {
		changeFootnoteRefClickAction("modal");
		fntoggle.textContent = "Jumplink Footnotes";
	}
});

// set onclick action of all footnote ref links to open modal
function changeFootnoteRefClickAction(desiredAction){
	let fnref_list = document.querySelectorAll('.footnote-ref');
	for (const fnref of fnref_list){
		if (desiredAction == "jumplink") {
			fnref.querySelector('a').onclick = function(){return true;};
		} else {
			fnref.querySelector('a').onclick = function(){
				openFootnoteModal(fnref.id.slice(6))
				return false; // stop from actually going to link
				};
		}
	}
}

changeFootnoteRefClickAction("modal"); // always run once on load

// footnote behavior
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
const fnmodal = document.getElementById("fnmodal");

// click (anywhere) to close modal
fnmodal.addEventListener("click", () => {
	fnmodal.close();
});

// open modal with content for a given footnote number
function openFootnoteModal(fn_number){	
	//console.log(`#fn-${fn_number}`);
	let tmpHTML =	document.querySelector(`#fn-${fn_number}`).cloneNode(true);
	tmpHTML.querySelector(`a[href^="#fnref"]`).remove(); // delete return arrow
	fnmodal.innerHTML = tmpHTML.innerHTML;
	fnmodal.showModal();
}

// ################################################################
// ################################################################
//							IMAGE LIGHTBOX
// ################################################################
// ################################################################


// toggle image display
const imgtoggle = document.getElementById("toggle-popup-images");
imgtoggle.addEventListener("click", () => {
	if (imgtoggle.textContent == "Lightbox Images") {
		changeImgClickAction("lightbox");
		imgtoggle.textContent = "Images in New Tab";
	} else {
		changeImgClickAction("newtab");
		imgtoggle.textContent = "Lightbox Images";
	}
});

// set onclick action of all footnote ref links to open modal
function changeImgClickAction(desiredAction){
	let imglink_list = document.querySelectorAll('.imagelink');
	for (const ilink of imglink_list){
		if (desiredAction == "newtab") {
			console.log("newtab");
			ilink.onclick = function(){return true;};
		} else {			
			ilink.onclick = function(){
				// console.log(ilink.getAttribute('href'));
				openImageModal(ilink);
				return false; // stop from actually going to link
				};
		}
	}
}

changeImgClickAction("lightbox");  // always run once on load

const imgmodal = document.getElementById("imgmodal");

// click (anywhere) to close modal
imgmodal.addEventListener("click", () => {
	imgmodal.close();
});

// open modal with image
function openImageModal(ilinkEl){
	//let tmpHTML =	document.querySelector(`#fn-${fn_number}`).cloneNode(true);
	//tmpHTML.querySelector(`a[href^="#fnref"]`).remove(); // delete return arrow
	//fnmodal.innerHTML = tmpHTML.innerHTML;
	console.log("imgmodal");
	console.log(ilinkEl.getAttribute('href'));
	console.log(ilinkEl.nextSibling.innerHTML);
	//imgmodal.innerHTML = `<img src="${ilinkEl.getAttribute('href')}" alt=""><div><p id="imgcaption">${ilinkEl.nextSibling.innerHTML}</p></div>`;
	imgmodal.innerHTML = `<div class="imgwrapper"><img src="${ilinkEl.getAttribute('href')}" alt=""></div><div class="modalcaption"><p id="imgcaption">${ilinkEl.nextSibling.innerHTML}</p></div>`;
	imgmodal.showModal();
}


// ################################################################
// ################################################################
//							FLEXIBLE TOC
// ################################################################
// ################################################################

const rtbutton = document.getElementById('return2top');

// detecting if TOC has wrapped to apply layout-specific formatting
// adapted from https://stackoverflow.com/a/58949834
function checkFlexwrap() {
	console.log("called checkFlexwrap");
	let elTOC= document.getElementById("article-toc");
	let elContent= document.getElementById("article-content");
	//console.log(elTOC.offsetTop + " // " + elContent.offsetTop)
	
	if (elTOC.offsetTop === elContent.offsetTop) {
		elTOC.classList.add("sideTOC");
		elContent.classList.remove("topTOC");
		rtbutton.classList.remove("buttonVisible"); // return to top button also dependent on this
		// console.log("TOC is on the side");
	} else {
		elTOC.classList.remove("sideTOC");
		elContent.classList.add("topTOC");
		if (document.getElementById("sec-background").getBoundingClientRect().top < 20) {
			rtbutton.classList.add("buttonVisible");
		}
		// console.log("TOC is on the top");		
	}
}

checkFlexwrap(); // always run once on load

// then run anytime window resized

/*
// debounce: https://web.archive.org/web/20220714020647/https://bencentra.com/code/2015/02/27/optimizing-window-resize.html
*/
let delay = 50; // delay after event is "complete" to run callback
let timeout = false; // holder for timeout id
window.addEventListener('resize', function() {  
  clearTimeout(timeout); // clear the timeout  
  timeout = setTimeout(checkFlexwrap, delay); // start timing for event "completion"
});

//window.onresize = checkFlexwrap;


// ################################################################
// ################################################################
//					TOC FORMATTING/ACTIVE NAVIGATION
// ################################################################
// ################################################################


// https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
// intersection observer for checking headings coming into view
// remember this only matters when toc is fixed on the side (don't need to worry about sticky use case)

// want trigger when heading just starts to leave the screen (touches the top)
// so threshold should be close to 1, instead of default 0
let options = {
  // root: document.querySelector("#scrollArea"), deafaults to browser viewport
  //rootMargin: "-10px 0px 0px 0px", // default all 0
  threshold: 1.0,
};


// "the observer callback will always fire the first render cycle after observe() is called, even if the observed element has not yet moved with respect to the viewport"
// leads to entries out of view already being highlighted
// decided to deal by adding a sacrificial "init" class in the HTML

// true/false transition occurs when element exits viewport, regardless of at top or bottom. But for ToC purposes, only top should matter. Therefore check vertical position as well.

const allHeadings = document.querySelectorAll('#article-content h2, #article-content h3');
const allHeadingIDs = Array.from(allHeadings, node => node.id); // extract ids
	
function highlightTOCentry(id) {
	// remove all other previously highlighted items
	let prevactive = document.querySelectorAll('#article-toc li.activenav');
	for (const h of prevactive) {
		h.classList.remove("activenav");
	}
	
	// add highlight
	if (id !== "") {
		//document.querySelector(`#article-toc a[href="#${id}"]`).classList.add("activenav");
		document.querySelector(`#article-toc a[href="#${id}"]`).parentElement.classList.add("activenav");
	}	
}

let callback_headings = (entries, observer) => {
	
	//console.log(entries);
	
	// only bother doing fancy TOC highlighting if sidebar view
	if (!document.getElementById("article-toc").classList.contains("sideTOC")) {
		highlightTOCentry(""); // clear all highlighting
	} else {		
		for (const e of entries) {
			
			/*
			// trying to find appropriate threshold
			// scroll down seems to have lower threshold than scroll up

			if (e.boundingClientRect.top < 300) {			
				if (e.isIntersecting) {
					console.log(`${e.boundingClientRect.top} [${e.target.id}] ${e.isIntersecting}`);
				} else {
					console.log(`########### ${e.boundingClientRect.top} [${e.target.id}] ${e.isIntersecting}`);
				}
			}		
			*/
			
			const h_navitem = document.querySelector(`#article-toc a[href="#${e.target.id}"]`);
			
			if (h_navitem.classList.contains("init")) {
				h_navitem.classList.remove("init");
			} else {
				if (e.boundingClientRect.top < 100) {
					if (!e.isIntersecting) {
						highlightTOCentry(e.target.id);				
					} else {
						let n = allHeadingIDs.indexOf(e.target.id);
						try {
							highlightTOCentry(allHeadingIDs[n-1]);
						} catch {
							highlightTOCentry("");
						}
					}
				}
			}		
		} // end loop through observer entries
	}
};

let iobs_headings = new IntersectionObserver(callback_headings, options);

// observe all article headings
for (const h of allHeadings) {
	iobs_headings.observe(h);
}
		

// if person reloads in middle of section - make sure its highlighted to start
// this is run once on initial page load
// seeing some weird behavior where allHeadingPos values don't match up with positions when I check them despite not scrolling. Maybe called while some elements still shifting around? Try adding small delay.

setTimeout(() => {
	
	if (document.getElementById("article-toc").classList.contains("sideTOC")) {		
		const allHeadingPos = Array.from(allHeadings, node => node.getBoundingClientRect().top);
		const n_1stVisibleHeading = allHeadingPos.findIndex((element) => element >= 0);
		//console.log(allHeadingPos[n_1stVisibleHeading] + " " + allHeadingIDs[n_1stVisibleHeading]);
		
		try {
			if (allHeadingPos[n_1stVisibleHeading] < 20) {
				highlightTOCentry(allHeadingIDs[n_1stVisibleHeading]);
			} else {
				highlightTOCentry(allHeadingIDs[n_1stVisibleHeading-1]);
			}
			
		} catch {
			highlightTOCentry("");
		}
	}
	}, 100);
	
	
// handle jumplink case (intersectionobserver detects previous section instead)
// doesn't seem to work as intersectionobserver's callback happens after onclick, overwriting the correct highlighting
// clunky fix: added a delay. maybe in future after learn more async js, do something smarter
const allSectionLinks = document.querySelectorAll(`a[href^="#sec-`);
for (let seclink of allSectionLinks) {
	seclink.onclick = function(){
		setTimeout(() => {
			highlightTOCentry(""); // remove all highlighting
			highlightTOCentry(seclink.getAttribute("href").slice(1)); // highlight the target heading
			}, 10);
		return true;
	};
}

// ################################################################
// ################################################################
//						"RETURN TO TOP" BUTTON
// ################################################################
// ################################################################

// could reuse above intersection observer?
// separate for now (esp. since different options)
// only observe first heading, and depending on that, show/hide button

// due to sticky behavior, heading never actually goes past top of screen
// therefore need to change top margin

let options_h1 = {
  // root: document.querySelector("#scrollArea"), deafaults to browser viewport
  rootMargin: "-5px 0px 0px 0px", // default all 0
  threshold: 1.0,
};


let callback_h1 = (entries, observer) => {
	
	//let e = entries[0];
	//console.log(`${e.boundingClientRect.top} [${e.target.id}] ${e.isIntersecting}`);
	
	if (document.getElementById("article-content").classList.contains("topTOC")) {
	
		let e = entries[0];		
		
		if (e.boundingClientRect.top < 100) {
			if (!e.isIntersecting) {
				rtbutton.classList.add("buttonVisible");			
			} else {
				rtbutton.classList.remove("buttonVisible");
			}
		}	
	}
};

let iobs_h1 = new IntersectionObserver(callback_h1, options_h1);
iobs_h1.observe(allHeadings[0]);

// again, handle jumplink case
rtbutton.querySelector('a').onclick = function(){
		rtbutton.classList.remove("buttonVisible");
		return true;	};

/*



*/