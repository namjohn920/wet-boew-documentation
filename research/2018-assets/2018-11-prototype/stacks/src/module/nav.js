/**
* keys.js - allow navigation through lists with the keyboard
* @returns {void}
*/
define( [ "module/element", "module/aria" ], function( ElementUtil, AriaUtil ) {
	
	/**
	* keycode - determines what action to take when a key is pressed
	* @private
	* @param {object} event - the event that contains information about the key
	* @param {string} orientation - whether the menu is horizontal or vertical (navigated with left/right or up/down)
	* @returns name of action to take or false if invalid key
	* @type string / bool
	*/
	function keycode( event, orientation ) {
		
		let code = event.charCode || event.keyCode;
		if ( code == 9 ) {
			return 'tab';
		}
		/*if ( code == 13 ) {
			return 'enter';
		}*/
		if ( code == 27 ) {
			return 'exit';
		}
		if ( orientation == "horizontal" ) {
			if ( code == 39 ) { //right arrow
				return 'increment';
			}
			if ( code == 37 ) { //left arrow
				return 'decrement';
			}
			if ( code == 40 ) { //down arrow
				return 'in';
			}
			if ( code == 38 ) { //up arrow
				return 'null';
			}
		}
		else if ( orientation == "vertical"){
			if ( code == 40 ) { //down arrow
				return 'increment';
			}
			if ( code == 38 ) { //up arrow
				return 'decrement';
			}
			if ( code == 39 ) { //right arrow
				return 'in';
			}
			if ( code == 37 ) { //left arrow
				return 'out';
			}
		}
		else if ( orientation == "grid"){
			if ( code == 40 ) { //down arrow
				return 'down';
			}
			if ( code == 38 ) { //up arrow
				return 'up';
			}
			if ( code == 39 ) { //right arrow
				return 'increment';
			}
			if ( code == 37 ) { //left arrow
				return 'decrement';
			}
			if ( code == 13){
				return "in"
			}
		}
		
		return false;
	};
	
	/**
	* find - determines which item from a set has a certain class
	* @private
	* @param {NodeList} $children - the set of items from which to check
	* @param {string} classname - the class to look for
	* @returns the index of the element if found, -1 if not
	* @type int
	*/	
	function find( $children, classname ) {
		
		for (let idx = $children.length - 1; idx >= 0; idx--) {
			if ( ElementUtil.hasClass( $children[idx], classname) )
			{
				return idx
			}
		}
		return -1;
	};
	
	/**
	* the main function body
	* @public
	* @param {DOMElement} $elm the element for which the data-wb5 attribute is located
	* @param {String} selector the CSS3 query string to which target the children or not
	* @param {Object} options - for the element/node
	* @returns void
	*/
	function handle( $elm, selector, options ) {
		
		let properties = Object.assign({ eventname: "keypress", classes: "active" }, options ),
		children = ElementUtil.nodes( $elm, selector );
		//Add event listeners
		listen( $elm, children, properties)
	};
	
	/**
	* listen - attaches listener to handle key presses
	* @private
	* @param {DOMElement} $elm - the element that captured the event
	* @param {nodeList} children - subelements to cycle through
	* @param {Object} properties - contains module configuration data
	* @returns void
	*/
	function listen($elm, children, properties){
		

		var focusWithin = false;

		let submenus = $elm.querySelectorAll("[aria-haspopup=true]")
		for (let node of submenus){
			AriaUtil.add(node, "expanded", false)
		}

		ElementUtil.addListener( $elm, "focusin", function(event){
			focusWithin = true;
		})

		//Remove classes on unfocus, unless otherwise specified
		ElementUtil.addListener( $elm, "focusout", function(event){
			focusWithin = false;
                timer = setTimeout( function() {
                    if( !focusWithin ){
						if(!properties.KeepClassOnBlur){
						ElementUtil.removeClass( $elm, properties.classes );
						
						for (var child of children){
							ElementUtil.removeClass( child, properties.classes )
						}
					}
                    }
                },1); 
		})

		//handle key presses
		ElementUtil.addListener( $elm, properties.eventname, function( event ){
			let advance,
			current = find( children, properties.classes ),
			total = children.length,
			next = 0,
			key = keycode( event, properties.orientation ),
			currentElm = (current == -1) ? $elm : children[current],
			nextElm = currentElm,
			classesToAdd = properties.classes,
			removeOnMove = true;
			$elm.focus()
			if ( !key ) { //invalid key press
				return;
			}
			if ( key != 'tab' ) {	
				event.preventDefault();	
			}
			if (key == 'in'){	//enter a submenu
				event.stopPropagation();
				let submenu = currentElm.querySelector( "[data-wb5~=nav]" ) || currentElm.parentElement.querySelector( "[data-wb5~=nav]" );
				if ( submenu ) {
					if (submenu.parentElement == currentElm || submenu.parentElement == currentElm.parentElement){
						nextElm = submenu.querySelector( submenu.dataset.wb5NavSelector );
						classesToAdd = JSON.parse(submenu.dataset.wb5NavOptions).classes;
						submenu.focus()
						removeOnMove = false;
					}
				}
				else{	//if no submenu, then move along the nearest horizontal menu bar
					let supermenu = $elm.closest("[data-wb5-nav-options*=horizontal], [data-wb5-nav-options*=grid]");
					if (supermenu && supermenu != $elm){
						let superMenuChildren = ElementUtil.nodes(supermenu, supermenu.dataset.wb5NavSelector),
						superMenuIndex = find(superMenuChildren, JSON.parse(supermenu.dataset.wb5NavOptions).classes),
						superMenuItem = superMenuChildren[superMenuIndex];

						ElementUtil.removeClass( superMenuItem, JSON.parse(supermenu.dataset.wb5NavOptions).classes )
						superMenuIndex++
						if (superMenuIndex >= superMenuChildren.length){
							superMenuIndex = 0;
						}
						nextElm = superMenuChildren[superMenuIndex]
						classesToAdd = JSON.parse(supermenu.dataset.wb5NavOptions).classes;
						supermenu.focus()
					}
				}
			}
			else if( key == 'out' ) { //exit a submenu
				let supermenu = $elm.parentElement.closest("[data-wb5~=nav]");
					if (supermenu){
						if (JSON.parse(supermenu.dataset.wb5NavOptions).orientation == "vertical"){
						superMenuItem = $elm.closest( supermenu.dataset.wb5NavSelector ) || $elm.parentElement.querySelector(supermenu.dataset.wb5NavSelector);
						if (superMenuItem){
							classesToAdd = JSON.parse(supermenu.dataset.wb5NavOptions).classes;
							nextElm = superMenuItem
							supermenu.focus()
							event.stopPropagation();
						}
					}
				}
			}
			else if ( key == 'increment' || key == 'decrement' || key == 'up' || key =='down' ) {
				advance = (key == 'increment' || key=='down') ? 1 : -1;
				if (key == 'up' || key== 'down'){
					advance *= parseInt(properties.width);
				}
				if ( current + advance < total ) {
					next = current + advance;
					next = ( next < 0 ) ? total + next : next;
				}
				
				if ( current + advance > total ) {
					next = current + advance;
					next = ( next > total ) ? next - total : next;
				}
				nextElm = children[next]

				event.stopPropagation();
			}
			if (nextElm){
				if (removeOnMove){ //remove the class on move, unless otherwise specified
					ElementUtil.removeClass(currentElm, properties.classes);
					if(currentElm.matches("[aria-expanded~=true]")){
						AriaUtil.add(currentElm, "expanded", "false")
					}
				}
				let itemLink = nextElm.querySelector("a"); //focus in on A elements
				if (itemLink){
					if (itemLink.parentElement == nextElm){
						itemLink.focus();
					}
				}
				else if (nextElm.nodeName == "A"){
					nextElm.focus();
				}
				//nextElm.scrollIntoView();
				ElementUtil.addClass(nextElm, classesToAdd);
				if(nextElm.matches("[aria-expanded~=false]")){
					AriaUtil.add(nextElm, "expanded", "true")
				}

		}
			
		});
	};
	
	return {
		handle: handle
	};
} );