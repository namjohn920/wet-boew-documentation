/**
 * @title WET-BOEW combobox plugin
 * @overview Plugin contained to show an example of how to create your custom WET plugin
 * @license wet-boew.github.io/wet-boew/License-en.html / wet-boew.github.io/wet-boew/Licence-fr.html
 * @author @duboisp
 */
( function( $, window, doc, wb ) {
"use strict";
/*
 * Variable and function definitions.
 * These are global to the plugin - meaning that they will be initialized once per page,
 * not once per instance of plugin on the page. So, this is a good place to define
 * variables that are common to all instances of the plugin on a page.
 */
var componentName = "wb-combobox",
	selector = "." + componentName,
	initEvent = "wb-init" + selector,
	$document = wb.doc,
	defaults = {},

	KeyCode = {
		BACKSPACE: 8,
		TAB: 9,
		RETURN: 13,
		ESC: 27,
		SPACE: 32,
		PAGE_UP: 33,
		PAGE_DOWN: 34,
		END: 35,
		HOME: 36,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
		DELETE: 46
	},

	currentlyOpened,
	isLastActiveKeyboardSelect,

	docFragmentSourceUI = doc.createDocumentFragment(),

	/**
	 * @method init
	 * @param {jQuery Event} event Event that triggered the function call
	 */
	init = function( event ) {
		// Start initialization
		// returns DOM object = proceed with init
		// returns undefined = do not proceed with init (e.g., already initialized)
		var elm = wb.init( event, componentName, selector ),
			$elm,
			settings;
		if ( elm ) {
			$elm = $( elm );
			// ... Do the plugin initialisation
			// Get the plugin JSON configuration set on attribute data-wb-helloworld
			settings = $.extend(
				true,
				{},
				defaults,
				window[ componentName ],
				wb.getData( $elm, componentName )
			);


			var idListBox = wb.getId(),
				selectNewId = wb.getId(),
				inputName = elm.name;


			// Transform the select into a input text field

			var isInput = elm.nodeName === "INPUT",
				isSelect = elm.nodeName === "SELECT";

			if ( ! (isInput || isSelect) ) {
				throw "combobox must be set on input or select element only";
			}

			if ( isInput ) {

				// Check if it is linked to a datalist
				var datalistID = elm.getAttribute( "list" ),
					datalist = datalistID && doc.getElementById( datalistID );

				if ( !datalist ) {
					throw "A list must be set"
				}


				// Just set the property at the input and set the surrounding UI


				elm.setAttribute( "autocomplete", "off" );
				elm.setAttribute( "data-rule-fromListbox", "true" );
				elm.setAttribute( "aria-autocomplete", "list" );
				elm.setAttribute( "aria-controls", idListBox );
				elm.setAttribute( "aria-activedescendant", "" );

				elm.removeAttribute( "list" );



				var $cmbBox = $elm.wrap( "<div class='wb-fieldflow-init' role='combobox' aria-expanded='false' aria-haspopup='listbox' aria-owns='" + idListBox + "' data-source-elm='" + datalistID + "'>" ).parent();

				$cmbBox.append( "<div id='" + idListBox + "' role='listbox' class='hidden'>" );

				$cmbBox.wrap( "<div class='combobox-wrapper'>" );

				// The datalist pattern is different from the select pattern.
				// In order to make it work, we need find out the input and then enhance those.

			} else {

				var ui = "<div class='combobox-wrapper'>" +
						"<div class='wb-fieldflow-init' role='combobox' aria-expanded='false' aria-haspopup='listbox' aria-owns='" + idListBox + "' data-source-elm='" + selectNewId + "'>" +
						"<input autocomplete='off' data-rule-fromListbox='true' id='" + elm.id + "' aria-autocomplete='list' aria-controls='" + idListBox + "' name='" + inputName + "' aria-activedescendant='' />" +
						"</div>" +
						"<div id='" + idListBox + "' role='listbox' class='hidden'>" +
						"</div>" +
						"</div>";

				elm.id = selectNewId;

				// Add it after the select box
				var $ui = $( ui );
				$elm.after( $ui );

				// Set a reference to the select and detach it from the live DOM
				$ui.get( 0 ).dataset.sourceElm = elm;
				docFragmentSourceUI.appendChild( elm );

			}

			// Polyfill IE11 for documents fragment
			if ( typeof docFragmentSourceUI.getElementById !== "function" ) {
				docFragmentSourceUI.getElementById = function( elmID ) {
					var child = this.childNodes,
						i, i_cache,
						i_len = child.length;

					for ( i = 0; i < i_len; i = i + 1 ) {
						i_cache = child[ i ];
						if ( i_cache.id === elmID ) {
							return i_cache;
						}
					}
					return false;
				}
			}

			Modernizr.addTest( "stringnormalize", "normalize" in String );

			// IE11 add support for string normalization
			Modernizr.load( {
				test: Modernizr.stringnormalize,
				nope: [
					"site!deps/unorm" + wb.getMode() + ".js"
				]
			} );








			// Call my custom event
			// $elm.trigger( "name.of.your.event", settings );

			// Identify that initialization has completed
			wb.ready( $elm, componentName );
		}
	},

	/*

	https://github.com/vuejs/vue/blob/dev/src/compiler/parser/index.js#L370

	type ForParseResult = {
		for: string;
		alias: string;
		iterator1?: string;
		iterator2?: string;
	};
	*/
	parseFor = function( exp ) {
		var forAliasRE = /([^]*?)\s+(?:in|of)\s+([^]*)/;
		var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
		var stripParensRE = /^\(|\)$/g;

		var inMatch = exp.match( forAliasRE );

		if ( !inMatch ) {
			return;
		}

		var res = {};

		res.for = inMatch[ 2 ].trim();

		var alias = inMatch[ 1 ].trim().replace( stripParensRE, '');

		var iteratorMatch = alias.match( forIteratorRE );

		if ( iteratorMatch ) {
			res.alias = alias.replace( forIteratorRE, '' );
			res.iterator1 = iteratorMatch[ 1 ].trim();
			if ( iteratorMatch[ 2 ] ) {
				res.iterator2 = iteratorMatch[ 2 ].trim();
			}
		} else {
			res.alias = alias
		}

		return res;
	},


	getObjectAt = function( dataProv, pointer ) {

		var pointerParts = pointer.split( "." ),
			i_len = pointerParts.length,
			i, i_cache, fnName;

		// Get the object to be iterated
		for ( i = 0; i < i_len; i = i + 1 ) {
			i_cache = pointerParts[ i ];

			if ( i_cache.lastIndexOf( "()" ) !== -1 ) {

				// Get the function name
				fnName = i_cache.substring(0, i_cache.length - 2);

				// call the function
				if ( typeof dataProv === "string" ){
					dataProv = String.prototype[ fnName ].call( dataProv );
				} else {
					dataProv = dataProv[ fnName ].call();
				}
			} else {

				// Get the property
				dataProv = dataProv[ i_cache ];
			}
		}
		return dataProv;
	},

	IE11templatePolyfill = function( elm ) {
		if ( elm.content ) {
			return;
		}
		// Polyfill Template for IE11

		var elPlate = elm,
			qContent,
			docContent;

		qContent = elPlate.childNodes;
		docContent = doc.createDocumentFragment();

		while ( qContent[ 0 ] ) {
			docContent.appendChild( qContent[ 0 ] );
		}

		elPlate.content = docContent;
	},

	// Parse string HTML into DOM fragment
	parseHTML = function( html ) {
		var t = document.createElement('template');
		t.innerHTML = html;
		IE11templatePolyfill( t );
		return t.content.cloneNode(true);
	},

	// Remove accent and normalize the string
	//
	// str: String to be normalized
	// return: A normalized string with no accent
	//
	unAccent = function( str ) {
		return str.normalize( "NFD" ).replace( /[\u0300-\u036f]/g, "" );
	},

	updateResults = function( input, shouldShowAll ) {

		var listbox = doc.getElementById( input.getAttribute( "aria-controls" ) );

		var $combobox = $( input ).parent();

		//var sourceElm = doc.getElementById( $combobox.data().sourceElm );
		var sourceElm = docFragmentSourceUI.getElementById( input.parentNode.dataset.sourceElm ) || doc.getElementById( input.parentNode.dataset.sourceElm );

		var behaviouralElm = (sourceElm.nodeName === "SELECT"? sourceElm : input );

		// Are we waiting to load result?
		if ( sourceElm.dataset.wbWaiting ) {
			return;
		}

		// Do we need to load something?
		if( sourceElm.dataset.wbLoad ) {
			// Load the JSON suggestion and wait before to move forward
			sourceElm.dataset.wbWaiting = "Loading";

			// Load the JSON file
			$combobox.trigger( {
				type: "json-fetch.wb",
				fetch: {
					url: sourceElm.dataset.wbLoad
				}
			} );
			return;
		}

		if ( sourceElm.nodeName === "DATALIST" && listbox.classList.contains( "hidden" ) ) {
			if ( behaviouralElm.dataset.wbOpenMinLen && input.value.length < parseInt( behaviouralElm.dataset.wbOpenMinLen ) ) {
				return;
			}
		}

		var dataProvider = {};

		dataProvider[ sourceElm.nodeName.toLowerCase() ] = sourceElm;


		// Load the suggestion, if any
		if ( sourceElm.dataset.wbSuggestions ) {
			dataProvider[ "wbLoad" ] = JSON.parse(sourceElm.dataset.wbSuggestions);
		}

		// Get the template if any, or use the default ones
		var template,
			tmplId = sourceElm.getAttribute("data-wb5-template");

		if ( !tmplId ) {
			template = sourceElm.querySelector( "template" );
		} else {
			template = doc.getElementById( tmplId );
		}


		var clone;

		if ( template ) {
			
			IE11templatePolyfill( template );

			clone = template.content.cloneNode( true );		
		} else {
			console.log( "no Template, fallback on defaults");
			clone = $( "<ul><li role='option' data-wb5-for='o in select' data-wb5-selectvalue='{{o.textContent}}'>{{o.textContent}}</li></ul>" ).get( 0 );
		}

		// Parse the template and find the iterator

		var iteratorTmplAll = clone.querySelectorAll( "[data-wb5-for]" ),
			j_len = iteratorTmplAll.length,
			j,

			// Are we limiting the number of results?
			limit = parseInt( behaviouralElm.dataset.wbLimit || 0 ),
			nbItems = 0;

		for( j = 0; j < j_len; j ++ ) {

			var iteratorTmpl = iteratorTmplAll[ j ];

			// Extract the iterator property
			var iteratorCmd = iteratorTmpl.getAttribute( "data-wb5-for" );

			// Remove the for attribute
			iteratorTmpl.removeAttribute( "data-wb5-for" );

			// Parse For
			var forParsed = parseFor( iteratorCmd );

			// Get the object to be iterated
			var options = getObjectAt( dataProvider, forParsed.for );
			var i;

			if ( !options ) {
				throw "Iterator not found";
			}

			// Do we need to apply a filter? (if data-wb-filter-type attribute is set)
			var filterType = behaviouralElm.getAttribute( "data-wb-filter-type" ) || "any";
			var filterableValueInstruction = iteratorTmpl.getAttribute( "data-wb5-selectvalue" ).match( new RegExp( /{{\s?([^}]*)\s?}}/ ) )[ 1 ].trim();
			var filter = unAccent( input.value ).toLowerCase();

			// Iterate
			var opts_len = options.length;


			for( i =0; i < opts_len; i++) {

				var dt = {};
				dt[ forParsed.alias ] = options[ i ];

				var lstOptionValue = unAccent( getObjectAt( dt, filterableValueInstruction ) ).toLowerCase();

				// Check if we need to filter
				if ( filterType && filterType === "any" && lstOptionValue.indexOf( filter ) === -1 ) {
					continue;
				} else if ( filterType && filterType.toLowerCase() === "startwith" && lstOptionValue.indexOf( filter ) !== 0 ) {
					continue;
				} else if ( filterType && filterType === "word" && 
					( lstOptionValue.indexOf( filter ) !== 0 && !lstOptionValue.match( new RegExp( "\\s" + filter ) ) ) ) {
					continue;
				}



				var optItm = iteratorTmpl.cloneNode( true );
				// Assign it an unique id
				optItm.id = wb.getId();



				// Parse the mustache and recreate the DOM fragment
				var outerHTMLClone = optItm.outerHTML,
					regExMustache = /{{\s?([^}]*)\s?}}/g;
				outerHTMLClone = outerHTMLClone.replace( regExMustache, function( a, b ) {
					return getObjectAt( dt, b.trim() ).toString().replace( /"/g, "&quot;" );
				} );

				// Is there "option" tag in that template? if so we need to convert them into "p" as <option> can't be children of <div>
				outerHTMLClone = outerHTMLClone.replace( /<option/g, "<p role='option'").replace( /option>/g, "p>" );

				optItm = parseHTML( outerHTMLClone );

				iteratorTmpl.parentNode.appendChild( optItm );

				nbItems = nbItems + 1;

				if ( limit && nbItems >= limit ) {
					break;
				}
			}

			iteratorTmpl.parentNode.removeChild( iteratorTmpl );
		
		}

		listbox.innerHTML = "";
		listbox.appendChild( clone );
		$( listbox ).removeClass( "hidden" );

		currentlyOpened = $combobox.get( 0 );
	},

	hideListbox = function( ) {
		var overlayElmId = currentlyOpened.getAttribute( 'aria-owns' ),
			$overlay = $( "#" + overlayElmId ),
			input = currentlyOpened.getElementsByTagName( "input" )[ 0 ],
			sourceElm = docFragmentSourceUI.getElementById( input.parentNode.dataset.sourceElm ) || doc.getElementById( input.parentNode.dataset.sourceElm );

		$overlay.addClass( "hidden" );

		// unset the reference at the overlay currently opened
		currentlyOpened = null;
	},

	onChange = function( elm ) {

		validateSelection( elm );

/*
		$( elm.parentNode ).trigger( "change", 
		{
			value : elm.value

		} );
		*/
	},

	validateSelection = function( input ) {

		var scrElement = docFragmentSourceUI.getElementById( $( input ).parent().get( 0 ).dataset.sourceElm ) || doc.getElementById( $( input ).parent().get( 0 ).dataset.sourceElm ),
			isJqueryValidIntegration = input.form && input.form.parentNode.classList.contains( "wb-frmvld" );

		// Ensure the input value is valid, if the source is a select element
		if ( scrElement.nodeName !== "SELECT" ){
			return;
		}


		// is it required?
		if ( scrElement.getAttribute( "required" ) === null && input.value === "" )  {
			input.setCustomValidity( "" );
			if ( isJqueryValidIntegration ) {
				$( input ).valid();
			}
			console.log( "no error Empty");

			return true;
		}

		// As this feature filter suggestion as we type, the valid value should be already in the actual listbox

		var overlayElmId = input.getAttribute( 'aria-controls' ),
			overlay = doc.getElementById( overlayElmId ),
			options = overlay.querySelectorAll( "[role=option]" ),
			inputValue = input.value,
			i, i_len = options.length,
			isValid;

		for( i = 0; i < i_len; i = i + 1 ){
			if ( inputValue === options[ i ].dataset.wb5Selectvalue ) {
				isValid = true;
				break;
			}
		}


		if ( !isValid ) {
			// Show the error message
			input.setCustomValidity( "You need to choose a valid options" );

			if ( isJqueryValidIntegration ) {
				$( input ).valid();
			}
			return false;
		} else {

			// Ensure there is no error message
			input.setCustomValidity( "" );

			if ( isJqueryValidIntegration ) {
				$( input ).valid();
			}
			return true;
		}

	}

	;


$document.on( "wb-ready.wb", function( event ) {
    if( $.validator ) {
		$.validator.addMethod( "fromListbox", function( value, element ){
			return element.checkValidity();
		}, "You need to choose a valid options");
    }
});

// JSON suggestion fetched
$document.on( "json-fetched.wb", "[role=combobox]", function( evt ) {

	var elm = evt.target,
		suggestions = evt.fetch.response;

	// Get the source element
	var sourceElm = docFragmentSourceUI.getElementById( elm.dataset.sourceElm ) || doc.getElementById( elm.dataset.sourceElm );

	// Attach the JSON list to the datalist element
	sourceElm.dataset.wbSuggestions = JSON.stringify( suggestions );

	// Remove the reference as it not needed anymore
	delete sourceElm.dataset.wbLoad;
	delete sourceElm.dataset.wbWaiting;

	var input = doc.querySelector( "[data-source-elm=" + sourceElm.id + "] input" );

	// Show only if the input still the active elements
	if ( input === doc.activeElement ) {
		// Get the input and show options
		updateResults( input, false );
	} else {
		// Validate his value to know if it is ok
	}

});


// Outside activity detection
$document.on( "click vclick touchstart focusin", "body", function( evt ) {
	// Close the overlay listbox


	if (!currentlyOpened || currentlyOpened.parentElement.contains(evt.target)) {
		return;
	}

	setTimeout( function() {
		hideListbox();
	}, 1 );
	
});


// Focus
$document.on( "focus click", "[role=combobox] input", function( event, data ) {

	if ( !currentlyOpened ) {
		// Open the overlay
		setTimeout( function() {
			updateResults( event.target, false );
		}, 1 );
	}

});


// In WET5, we should use the "blur" in order to validate the input
// Blur
$document.on( "blur", "[role=combobox] input", function( event, data ) {

	// Validate the input
	setTimeout( function(){
		onChange( event.target );

	}, 100 );

});




// keyup
$document.on( "keyup", "[role=combobox] input", function( evt ) {
	var key = evt.which || evt.keyCode,
		isInError = evt.target.classList.contains( "error" );

	switch (key) {
		case KeyCode.UP:
		case KeyCode.DOWN:
		case KeyCode.ESC:
		case KeyCode.RETURN:
		case KeyCode.HOME:
		case KeyCode.END:
			evt.preventDefault();

			if ( isInError ) {
				setTimeout( function() {
					onChange( evt.target );
				}, 100 );
			}

			return;
		default:
			setTimeout( function() {
				updateResults( evt.target, false );
				if ( isInError ) {
					onChange( evt.target );
				}
			}, 100 );
	}


});

// keydown
$document.on( "keydown", "[role=combobox] input", function( evt ) {

	// Open the overlay

	var key = evt.which || evt.keyCode,
		input = evt.target;

	if (key === KeyCode.ESC) {
		hideListbox();

		// The aria spec said clearing the text box is optionally,
		/*
		setTimeout(function () {
			// On Firefox, input does not get cleared here unless wrapped in
			// a setTimeout
			input.value = '';
		}, 1);*/
		return;
	}

	// If close, we need to open it
	if ( !currentlyOpened ) {
		updateResults( input, false );
	}



	/*
	if (this.resultsCount < 1) {
		if (this.hasInlineAutocomplete && (key === KeyCode.DOWN || key === KeyCode.UP)) {
			this.updateResults(true);
		}
		else {
			return;
		}
	}*/

	// var prevActive = this.getItemAt(activeIndex);
	var activeItem;



	// Get the item currently selected
	var activeDescendantID = input.getAttribute( "aria-activedescendant" ),
		prevActive = (activeDescendantID ? doc.getElementById( activeDescendantID ): null )  ;

	// Get all the options
	var options = doc.getElementById( input.getAttribute( "aria-controls" ) ).querySelectorAll( "[role=option]" ),
		resultsCount = options.length;

	// Find the index of the current active item
	var activeIndex = -1,
		i;

	if ( prevActive ) {
		for( activeIndex = 0; activeIndex < resultsCount; activeIndex ++ ) {
			if ( options[ activeIndex ].id === prevActive.id ) {
				break;
			}
		}

		if ( activeIndex >= resultsCount ) {
			activeIndex = -1;
		}
	}


	switch (key) {
		case KeyCode.UP:

			// Move focus to and select the previous option. If focus is on the first option do nothing
			if (activeIndex === -1) {
				activeIndex = resultsCount - 1;
			}
			else if ( activeIndex !== 0 ) {
				activeIndex--;
			}

			break;
		case KeyCode.DOWN:

			// Move focus to and select next option. If focus is on the first option do nothing
			if ( activeIndex === -1 ) {
				activeIndex = 0;
			}
			else if ( activeIndex < resultsCount ) {
				activeIndex++;
			}

			break;

		case KeyCode.HOME:

			// Move focus to and selects the first option
			activeIndex = 0;
			break;

		case KeyCode.END:

			// Move focus to and selects the last option
			activeIndex = resultsCount - 1;

			break;

		case KeyCode.RETURN:

			$( options[ activeIndex ] ).trigger( "wb.select" );

			hideListbox();
			evt.preventDefault(); // Need to prevent default here because when the combobox is within a form, the form are submited
			return;
		case KeyCode.TAB:

			// Should only select if the last active item selected was made through keyboard
			if ( isLastActiveKeyboardSelect ) {
				$( options[ activeIndex ] ).trigger( "wb.select" );
			}
			hideListbox();
			return;
		default:
			return;
	}

	evt.preventDefault();


	activeItem = options[ activeIndex ];

	if (prevActive) {
		// aria.Utils.removeClass(prevActive, 'focused');
		prevActive.setAttribute('aria-selected', 'false');
	}

	if (activeItem) {

		// Ensure the active item has an ID
		if ( !activeItem.id ) {
			activeItem.id = wb.getId();
		}

		input.setAttribute(
			'aria-activedescendant',
			activeItem.id
		);
		//aria.Utils.addClass(activeItem, 'focused');
		activeItem.setAttribute('aria-selected', 'true');

		isLastActiveKeyboardSelect = true;

		/*if (this.hasInlineAutocomplete) {
			this.input.value = activeItem.innerText;
		}*/
	}
	else {
		input.setAttribute(
			'aria-activedescendant',
			''
		);
	}

});

// Change active descendant on mouse hover
$document.on( "mouseover", "[role=listbox] [role=option][data-wb5-selectvalue]", function( event, data ) {

	var input = currentlyOpened.querySelector( "input" ),
		activeItem = event.target;

	// Get the previous selected item
	var activeDescendantID = input.getAttribute( "aria-activedescendant" ),
		prevActive = (activeDescendantID ? doc.getElementById( activeDescendantID ): null )  ;

	if (prevActive) {
		prevActive.setAttribute('aria-selected', 'false');
	}

	// Ensure the active item has an ID
	if ( !activeItem.id ) {
		activeItem.id = wb.getId();
	}

	if ( prevActive && prevActive.id !== activeItem.id ) {
		isLastActiveKeyboardSelect = false;
	}

	// Set this item as the active ones
	activeItem.setAttribute('aria-selected', 'true');

	// Set the active to the input
	input.setAttribute(
		'aria-activedescendant',
		activeItem.id
	);

} );


// Listbox click
$document.on( "click", "[role=listbox] [role=option][data-wb5-selectvalue]", function( event, data ) {

	// Get the input
	var $input = $( currentlyOpened.querySelector( "input" ) );

	// Select the options
	$( event.target ).trigger( "mouseover" ).trigger( "wb.select" );

	// Set the focus back on the input
	$input.trigger( "focus" );

	// Hide the overlay
	hideListbox();

} );

// Listbox click
$document.on( "wb.select", "[role=listbox] [role=option][data-wb5-selectvalue]", function( event, data ) {

	var elm = event.target;

	// Set the input value
	var input = doc.querySelector( "[aria-activedescendant=" + elm.id + "]");

	input.value = elm.dataset.wb5Selectvalue;

} );


// Bind the init event of the plugin
$document.on( "timerpoke.wb " + initEvent, selector, init );
// Add the timer poke to initialize the plugin
wb.add( selector );
} )( jQuery, window, document, wb );
