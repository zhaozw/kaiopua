/*
 *
 * GUI.js
 * Game user interface.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/ui/GUI.js",
		_GUI = {},
		_UIElement,
		_Button,
		_Menu,
		ready = false;
	
	/*===================================================
    
    public
    
    =====================================================*/
	
	main.asset_register( assetPath, { 
		data: _GUI,
		requirements: [
			"assets/modules/ui/UIElement.js",
			"assets/modules/ui/Button.js",
			"assets/modules/ui/Menu.js"
		],
		callbacksOnReqs: init_internal,
		wait: true
	});
	
	/*===================================================
    
    internal init
    
    =====================================================*/
	
	function init_internal ( uie, btn, mn ) {
		console.log('internal gui', _GUI);
		
		_UIElement = uie;
		_Button = btn;
		_Menu = mn;
		
		// properties
		
		_GUI.layers = {};
		_GUI.buttons = {};
		_GUI.menus = {};
		_GUI.messages = {};
		
		_GUI.active = [];
		_GUI.groups = {};
		_GUI.groupsNames = [];
		
		// functions
		
		_GUI.generate_button_back = generate_button_back;
		_GUI.generate_button_close = generate_button_close;
		
		_GUI.show_group = show_group;
		_GUI.hide_group = hide_group;
		
		_GUI.add_to_group = add_to_group;
		_GUI.remove_from_group = remove_from_group;
		_GUI.clean_groups = clean_groups;
		
		_GUI.fullscreen_api = ( function () {
			
			var fullScreenApi = { 
					supportsFullScreen: false,
					isFullScreen: function() { return false; }, 
					requestFullScreen: function() {}, 
					cancelFullScreen: function() {},
					fullScreenEventName: '',
					prefix: ''
				},
				browserPrefixes = 'webkit moz o ms khtml'.split(' ');
			
			// check for native support
			if (typeof document.cancelFullScreen != 'undefined') {
				fullScreenApi.supportsFullScreen = true;
				
			} else {	 
				// check for fullscreen support by vendor prefix
				for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
					fullScreenApi.prefix = browserPrefixes[i];
					
					if (typeof document[fullScreenApi.prefix + 'CancelFullScreen' ] != 'undefined' ) {
						fullScreenApi.supportsFullScreen = true;
						
						break;
					}
				}
			}
			
			// update methods to do something useful
			if (fullScreenApi.supportsFullScreen) {
				fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';
				
				fullScreenApi.isFullScreen = function() {
					switch (this.prefix) {	
						case '':
							return document.fullScreen;
						case 'webkit':
							return document.webkitIsFullScreen;
						default:
							return document[this.prefix + 'FullScreen'];
					}
				}
				fullScreenApi.requestFullScreen = function(el) {
					return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
				}
				fullScreenApi.cancelFullScreen = function(el) {
					return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
				}		
			}
			
			return fullScreenApi;
			
		} () );
		
		// init
		
		init_core();
		
		// build
		
		build();
		
	}
	
	/*===================================================
    
    core
    
    =====================================================*/
	
	function init_core () {
		
		var l = _GUI.layers,
			m = _GUI.menus;
		
		// container
		
		_GUI.container = new _UIElement.Instance( { 
			domElement: shared.domElements.$gameContainer,
			fullwindow: true
		} );
		
		// uiGameDimmer
		
        _GUI.uiGameDimmer = new _UIElement.Instance( {
			id: 'uiGameDimmer',
			cssmap: {
				"background-color" : "#333333"
			},
			fullwindow: true,
			timeShow: 500,
			timeHide: 500,
			opacityShow: 0.75
        } );
		
		// layers
		
		l.display = new _UIElement.Instance( {
			id: 'layer_display',
			fullwindow: true
        } );
		
		l.ui = new _UIElement.Instance( {
			id: 'layer_ui',
			pointerEvents: false,
			fullwindow: true
        } );
		
		l.uiPriority = new _UIElement.Instance( {
			id: 'layer_uiPriority',
			pointerEvents: false,
			fullwindow: true
        } );
		
		l.overlayDisplay = new _UIElement.Instance( {
			id: 'layer_overlayDisplay',
			pointerEvents: false,
			fullwindow: true
        } );
		
		l.overlayUI = new _UIElement.Instance( {
			id: 'layer_overlayUI',
			pointerEvents: false,
			fullwindow: true
        } );
		
		l.overlayAll = new _UIElement.Instance( {
			id: 'layer_overlayAll',
			pointerEvents: false,
			fullwindow: true
        } );
		
		l.errors = new _UIElement.Instance( { 
			domElement: shared.domElements.$errors,
			pointerEvents: false,
			fullwindow: true
		} );
		
		// build core structure
		
		_GUI.container.add( l.display, l.overlayDisplay, l.ui, l.overlayUI, l.uiPriority, l.overlayAll, l.errors );
		
	}
	
	/*===================================================
    
    build
    
    =====================================================*/
	
	function build () {
		
		// init
		
		init_buttons();
		
		init_menus();
		
		init_messages();
		
		// menus
		
		build_start_menu();
		
		build_navigation_menu();
		
		build_options_menu();
		
		build_end_menu();
		
		build_main_menu();
		
	}
	
	/*===================================================
    
    buttons
    
    =====================================================*/
	
	function init_buttons() {
		
		var b = _GUI.buttons;
		
		// fullscreen disabled until allows alphanumeric input
		
		b.fullscreenEnter = new _Button.Instance( {
			id: 'fullscreenEnter',
			image: shared.pathToIcons + 'fullscreen_32.png',
			imageSize: _UIElement.sizes.iconSmall,
			size: _UIElement.sizes.iconSmallContainer,
			tooltip: 'Fullscreen',
			spacing: _UIElement.sizes.spacing,
			circle: true,
			callback: fullscreen_enter,
			context: this,
			alignment: 'bottomright',
			enabled: false
		} );
		
		b.fullscreenEnter.hide( { remove: true, time: 0 } );
	
		b.fullscreenExit = new _Button.Instance( {
			id: 'fullscreenExit',
			image: shared.pathToIcons + 'fullscreen_exit_32.png',
			imageSize: _UIElement.sizes.iconSmall,
			size: _UIElement.sizes.iconSmallContainer,
			tooltip: 'Exit Fullscreen',
			spacing: _UIElement.sizes.spacing,
			circle: true,
			callback: fullscreen_exit,
			context: this,
			alignment: 'bottomright',
			enabled: false
		} );
	
		b.fullscreenExit.hide( { remove: true, time: 0 } );
		
		
		b.end = new _Button.Instance( {
			id: 'end',
			image: shared.pathToIcons + 'confirm_64.png',
			imageSize: _UIElement.sizes.iconMedium,
			size: _UIElement.sizes.iconMediumContainer,
			tooltip: 'Really Quit?',
			spacing: _UIElement.sizes.spacing,
			circle: true
		} );
		
		b.save = new _Button.Instance( {
			id: 'save',
			image: shared.pathToIcons + 'save_64.png',
			imageSize: _UIElement.sizes.iconMedium,
			size: _UIElement.sizes.iconMediumContainer,
			tooltip: 'Save progress',
			spacing: _UIElement.sizes.spacing,
			circle: true,
			enabled: false
		} );
		
		b.load = new _Button.Instance( {
			id: 'load',
			image: shared.pathToIcons + 'load_64.png',
			imageSize: _UIElement.sizes.iconMedium,
			size: _UIElement.sizes.iconMediumContainer,
			tooltip: {
				content: 'Load a saved game',
				contentDisabled: '(no save found!)'
			},
			spacing: _UIElement.sizes.spacing,
			circle: true,
			enabled: false
		} );
		
		b.mainMenu = new _Button.Instance( {
			id: 'mainMenu',
			image: shared.pathToIcons + 'computer_alt_64.png',
			imageSize: _UIElement.sizes.iconMedium,
			size: _UIElement.sizes.iconMediumContainer,
			tooltip: 'Main Menu',
			spacing: _UIElement.sizes.spacing,
			circle: true
		} );
	
		b.companionMenu = new _Button.Instance( {
			id: 'companionMenu',
			image: shared.pathToIcons + 'companion_64.png',
			imageSize: _UIElement.sizes.iconMedium,
			size: _UIElement.sizes.iconMediumContainer,
			tooltip: 'Companions!',
			spacing: _UIElement.sizes.spacing,
			circle: true,
			enabled: false
		} );
		
		b.houseMenu = new _Button.Instance( {
			id: 'houseMenu',
			image: shared.pathToIcons + 'home_64.png',
			imageSize: _UIElement.sizes.iconMedium,
			size: _UIElement.sizes.iconMediumContainer,
			tooltip: 'House Parts',
			spacing: _UIElement.sizes.spacing,
			circle: true,
			enabled: false
		} );
		
		b.map = new _Button.Instance( {
			id: 'map',
			image: shared.pathToIcons + 'whale_64.png',
			imageSize: _UIElement.sizes.iconMedium,
			size: _UIElement.sizes.iconMediumContainer,
			tooltip: 'Map',
			spacing: _UIElement.sizes.spacing,
			circle: true,
			enabled: false
		} );
		
	}
	
	function generate_button_back () {
		
		var button = new _Button.Instance( {
			id: 'close',
			image: shared.pathToIcons + 'undo_64.png',
			imageSize: _UIElement.sizes.iconSmall,
			width: _UIElement.sizes.iconSmallContainer,
			tooltip: 'Go Back',
			spacingRight: _UIElement.sizes.iconMediumContainer * 0.5 + _UIElement.sizes.spacing,
			alignment: 'rightcenter',
			alignmentOutside: true,
			circle: true,
			theme: 'white'
		} );
		
		return button;
		
	}
	
	function generate_button_close () {
		
		var button = new _Button.Instance( {
			id: 'close',
			image: shared.pathToIcons + 'close_64.png',
			imageSize: _UIElement.sizes.iconSmall,
			width: _UIElement.sizes.iconSmallContainer,
			spacing: 0,
			alignment: 'righttop',
			alignmentOutside: true,
			circle: true,
			theme: 'red'
		} );
		
		return button;
		
	}
	
	/*===================================================
    
    menus
    
    =====================================================*/
	
	function init_menus() {
		
		var m = _GUI.menus;
		
		// init
		
		m.start = new _Menu.Instance( {
            id: 'start'
        } );
		
		m.main = new _Menu.Instance( {
            id: 'main'
        } );
		
		m.options = new _Menu.Instance( {
            id: 'options'
        } );
		
		m.navigation = new _Menu.Instance( {
			id: 'navigation'
		} );
		
		m.end = new _Menu.Instance( {
			id: 'end'
		} );
		
	}
	
	function build_start_menu () {
		
		var m = _GUI.menus,
			b = _GUI.buttons;
		
		m.start.hide( { remove: true, time: 0 } );
	
		m.start.add( 
			new _Button.Instance( {
				id: 'play',
				text: 'Play!',
				theme: 'white',
				size: _Button.sizes.buttonMedium,
				spacing: _UIElement.sizes.spacing,
				circle: true,
				cssmap: {
					'font-size' : "30px",
					'font-family' : "'CoustardRegular', Georgia, serif"
				},
				alignment: 'center'
			} ),
			b.load,
			m.options
		);
		
		m.start.childrenAlwaysVisible.push( m.start.childrenByID.play );
		
		m.start.arrange_circle( {
			degrees: 360,
			radius: _Button.sizes.buttonMedium + _UIElement.sizes.spacing
		} );
		
	}
	
	function build_main_menu () {
		
		var m = _GUI.menus,
			b = _GUI.buttons;
		
		m.main.hide( { remove: true, hide: 0 } );
		
		m.main.add( 
			new _Button.Instance( {
				id: 'resume',
				text: 'Resume',
				width: _Button.sizes.buttonMedium,
				spacing: _UIElement.sizes.spacing,
				circle: true,
				cssmap: {
					'font-size' : "30px",
					'font-family' : "'CoustardRegular', Georgia, serif"
				},
				alignment: 'center'
			} ),
			b.save,
			b.load,
			m.options,
			m.end
		);
		
		m.main.childrenAlwaysVisible.push( m.main.childrenByID.resume );
		
		m.main.arrange_circle( {
			degrees: 360,
			radius: _Button.sizes.buttonMedium + _UIElement.sizes.spacing
		} );
	
	}
	
	function build_navigation_menu () {
		
		var m = _GUI.menus,
			b = _GUI.buttons;
		
		m.navigation.hide( { remove: true, hide: 0 } );
		
		m.navigation.add(
			b.companionMenu,
			b.houseMenu,
			b.map,
			b.mainMenu, 9999
		);
		
		m.navigation.arrange_line();
		
	}
	
	function build_options_menu () {
		
		var m = _GUI.menus;
		
		m.options.buttonOpen = new _Button.Instance( {
			id: 'open',
			image: shared.pathToIcons + 'cog_64.png',
			imageSize: _UIElement.sizes.iconMedium,
			size: _UIElement.sizes.iconMediumContainer,
			tooltip: 'Options',
			spacing: _UIElement.sizes.spacing,
			circle: true
		} );
		
		m.options.buttonClose = _GUI.generate_button_back();
		
		m.options.add(
			new _Button.Instance( {
				id: 'quality',
				theme: 'white',
				image: shared.pathToIcons + 'computer_64.png',
				imageSize: _UIElement.sizes.iconMedium,
				size: _UIElement.sizes.iconMediumContainer,
				tooltip: 'Quality',
				spacing: _UIElement.sizes.spacing,
				circle: true,
				enabled: false
			} ),
			new _Button.Instance( {
				id: 'keybindings',
				theme: 'white',
				image: shared.pathToIcons + 'keyboard_64.png',
				imageSize: _UIElement.sizes.iconMedium,
				size: _UIElement.sizes.iconMediumContainer,
				tooltip: 'Keybindings',
				spacing: _UIElement.sizes.spacing,
				circle: true,
				enabled: false
			} ),
			new _Button.Instance( {
				id: 'mouse',
				theme: 'white',
				image: shared.pathToIcons + 'mouse_64.png',
				imageSize: _UIElement.sizes.iconMedium,
				size: _UIElement.sizes.iconMediumContainer,
				tooltip: 'Hand Orientation',
				spacing: _UIElement.sizes.spacing,
				circle: true,
				enabled: false
			} ),
			new _Button.Instance( {
				id: 'volume',
				theme: 'white',
				image: shared.pathToIcons + 'sound_64.png',
				imageSize: _UIElement.sizes.iconMedium,
				size: _UIElement.sizes.iconMediumContainer,
				tooltip: 'Volume',
				spacing: _UIElement.sizes.spacing,
				circle: true,
				enabled: false
			} ),
			new _Button.Instance( {
				id: 'accessibility',
				theme: 'white',
				image: shared.pathToIcons + 'accessibility_64.png',
				imageSize: _UIElement.sizes.iconMedium,
				size: _UIElement.sizes.iconMediumContainer,
				tooltip: 'Accessibility',
				spacing: _UIElement.sizes.spacing,
				circle: true,
				enabled: false
			} )
		);
	
		m.options.arrange_circle( {
			degreeStart: 0,
			direction: -1,
			radius: _Button.sizes.buttonMedium + _UIElement.sizes.spacing
		} );
		
	}
	
	function build_end_menu () {
		
		var m = _GUI.menus,
			b = _GUI.buttons;
		
		m.end.buttonOpen = new _Button.Instance( {
			id: 'open',
			image: shared.pathToIcons + 'exit_64.png',
			imageSize: _UIElement.sizes.iconMedium,
			size: _UIElement.sizes.iconMediumContainer,
			tooltip: 'End Game',
			spacing: _UIElement.sizes.spacing,
			circle: true
		} );
		
		m.end.buttonClose = _GUI.generate_button_back();
		
		m.end.add( b.end );
		
		m.end.arrange_circle( {
			degreeStart: 0,
			radius: _Button.sizes.buttonMedium + _UIElement.sizes.spacing,
			forceShapeOnOpen: true
		} );
	
	}
	
	function init_messages () {
		
		var msg = _GUI.messages;
		
		// grid elements
		
		function make_message_grid_element ( id, cellClasses, parent, innerClasses, imgSrc, imgClasses, tooltipMessage ) {
			
			// cell
			
			var gpCell = new _UIElement.Instance( { 
				id: id,
				elementType: 'li',
				classes: cellClasses,
				cssmap: {
					'position' : 'relative'
				}
			} );
			parent.add( gpCell );
			
			// inner cell
			
			var gpCellInner = new _UIElement.Instance( {
				elementType: 'div',
				classes: innerClasses,
				cssmap: {
					'position' : 'relative'
				}
			} );
			gpCell.add( gpCellInner );
			
			// image
			
			if ( typeof imgSrc === 'string' ) {
				
				var gpCellImg = new _UIElement.Instance( {
					elementType: 'img',
					classes: imgClasses,
					src: imgSrc,
					tooltip: tooltipMessage,
					cssmap: {
						'position' : 'relative'
					}
				} );
				
				gpCellInner.add( gpCellImg );
				
			}
			
			// message
			
			var gpCellMessage = new _UIElement.Instance( {
				elementType: 'p',
				html: id,
				cssmap: {
					'position' : 'relative'
				}
			} );
			gpCell.add( gpCellMessage );
			
		}
		
		// controls
		/*
		_GUI.messages.controls = "";
		_GUI.messages.controls += "<div class='grid info_panel'><ul>";
		_GUI.messages.controls += "<li class='grid_compartment'><div class='grid_cell_inner'><img src='assets/icons/keyboard_rev_64.png'></div><p>move</p></li>";
		_GUI.messages.controls += "<li><div class='grid_cell_inner'><img src='assets/icons/key_arrows_rev_64.png'></div><p>run</p></li>";
		_GUI.messages.controls += "<li><div class='grid_cell_inner'><img src='assets/icons/key_wasd_rev_64.png'></div><p>run</p></li>";
		_GUI.messages.controls += "<li><div class='grid_cell_inner'><img src='assets/icons/key_space_rev_64.png'></div><p>jump</p></li>";
		_GUI.messages.controls += "</ul><ul>";
		_GUI.messages.controls += "<li class='grid_compartment'><div class='grid_cell_inner'><img src='assets/icons/mouse_rev_64.png'></div><p>interact</p></li>";
		_GUI.messages.controls += "<li><div class='grid_cell_inner'><img src='assets/icons/mouse_left_rev_64.png'></div><p>select</p></li>";
		_GUI.messages.controls += "<li><div class='grid_cell_inner'><img src='assets/icons/mouse_left_rev_64.png'></div><p>plant</p></li>";
		_GUI.messages.controls += "<li><div class='grid_cell_inner'><img src='assets/icons/mouse_left_drag_rev_64.png'></div><p>rotate plant</p></li>";
		_GUI.messages.controls += "<li><div class='grid_cell_inner'><img src='assets/icons/mouse_right_drag_rev_64.png'></div><p>rotate camera</p></li>";
		_GUI.messages.controls += "<li><div class='grid_cell_inner'><img src='assets/icons/mouse_middle_rev_64.png'></div><p>zoom</p></li>";
		_GUI.messages.controls += "</ul></div>";
		*/
		msg.controls = [];
		
		var gridControls = new _UIElement.Instance( { 
			id: 'grid_controls',
			classes: 'grid info_panel align_center',
			cssmap: {
				'position' : 'relative'
			}
		} );
		_GUI.messages.controls.push( gridControls );
		
		var cRow1 = new _UIElement.Instance( {
			elementType: 'ul',
			cssmap: {
				'position' : 'relative'
			}
		} );
		
		var cRow2 = new _UIElement.Instance( {
			elementType: 'ul',
			cssmap: {
				'position' : 'relative'
			}
		} );
		
		gridControls.add( cRow1 );
		gridControls.add( cRow2 );
		
		make_message_grid_element( 'move', 'grid_compartment', cRow1, 'grid_cell_inner', shared.pathToIcons + 'keyboard_rev_64.png' );
		make_message_grid_element( 'run', '', cRow1, 'grid_cell_inner', shared.pathToIcons + 'key_arrows_rev_64.png' );
		make_message_grid_element( 'run', '', cRow1, 'grid_cell_inner', shared.pathToIcons + 'key_wasd_rev_64.png' );
		make_message_grid_element( 'jump', '', cRow1, 'grid_cell_inner', shared.pathToIcons + 'key_space_rev_64.png' );
		
		make_message_grid_element( 'interact', 'grid_compartment', cRow2, 'grid_cell_inner', shared.pathToIcons + 'mouse_rev_64.png' );
		make_message_grid_element( 'select', '', cRow2, 'grid_cell_inner', shared.pathToIcons + 'mouse_left_rev_64.png' );
		make_message_grid_element( 'plant', '', cRow2, 'grid_cell_inner', shared.pathToIcons + 'mouse_left_rev_64.png' );
		make_message_grid_element( 'rotate plant', '', cRow2, 'grid_cell_inner', shared.pathToIcons + 'mouse_left_drag_rev_64.png' );
		make_message_grid_element( 'rotate camera', '', cRow2, 'grid_cell_inner', shared.pathToIcons + 'mouse_right_drag_rev_64.png' );
		make_message_grid_element( 'zoom', '', cRow2, 'grid_cell_inner', shared.pathToIcons + 'mouse_middle_rev_64.png' );
		
		// gameplay
		/*
		_GUI.messages.gameplay = "";
		_GUI.messages.gameplay += "<p><span class='highlight'>We're still in development</span>, but we hope you enjoy what we have so far. Here's what you can do:</p><br/>";
		_GUI.messages.gameplay += "<div class='grid'><ul>";
		_GUI.messages.gameplay += "<li><div class='grid_cell_inner grid_cell_inner_circle'><img src='assets/textures/dirt_128.jpg'></div><p>find</p></li>";
		_GUI.messages.gameplay += "<li><div class='grid_cell_inner grid_cell_inner_circle'><img src='assets/icons/game_steps_choose_plant_128.jpg'></div><p>choose</p></li>";
		_GUI.messages.gameplay += "<li><div class='grid_cell_inner grid_cell_inner_circle'><img src='assets/icons/game_steps_design_128.jpg'></div><p>design</p></li>";
		_GUI.messages.gameplay += "<li><div class='grid_cell_inner grid_cell_inner_circle'><img src='assets/icons/game_steps_grow_128.jpg'></div><p>grow!</p></li>";
		_GUI.messages.gameplay += "<li><div class='grid_cell_inner grid_cell_inner_circle'><img src='assets/icons/game_steps_explore_128.jpg'></div><p>explore</p></li>";
		_GUI.messages.gameplay += "</ul></div>";
		*/
		
		msg.gameplay = [];
		
		var introGameplay = new _UIElement.Instance( { 
			id: 'intro_gameplay',
			elementType: 'p',
			html: "<span class='highlight'>We're still in development</span>, but we hope you enjoy what we have so far. Here's what you can do:<br/><br/>",
			cssmap: {
				'position' : 'relative'
			}
		} );
		_GUI.messages.gameplay.push( introGameplay );
		
		var gridGameplay = new _UIElement.Instance( { 
			id: 'grid_gameplay',
			classes: 'grid align_center',
			cssmap: {
				'position' : 'relative'
			}
		} );
		_GUI.messages.gameplay.push( gridGameplay );
		
		var gpRow1 = new _UIElement.Instance( {
			elementType: 'ul',
			cssmap: {
				'position' : 'relative'
			}
		} );
		gridGameplay.add( gpRow1 );
		
		make_message_grid_element( 'Puzzles are puzzles', '', gpRow1, 'grid_cell_inner', shared.pathToTextures + 'dirt_128.jpg', 'grid_cell_inner_circle' );
		make_message_grid_element( 'Plant to complete puzzles', '', gpRow1, 'grid_cell_inner', shared.pathToIcons + 'game_steps_choose_plant_128.jpg', 'grid_cell_inner_circle' );
		make_message_grid_element( 'Less is more', '', gpRow1, 'grid_cell_inner', shared.pathToIcons + 'game_steps_design_128.jpg', 'grid_cell_inner_circle' );
		make_message_grid_element( 'Efficiency is rewarding!', '', gpRow1, 'grid_cell_inner', shared.pathToIcons + 'game_steps_grow_128.jpg', 'grid_cell_inner_circle' );
		make_message_grid_element( 'Gravity is shifty...', '', gpRow1, 'grid_cell_inner', shared.pathToIcons + 'game_steps_explore_128.jpg', 'grid_cell_inner_circle' );
		
	}
	
	/*===================================================
    
    fullscreen
    
    =====================================================*/
	
	function fullscreen_enter () {
		
		var b = _GUI.buttons,
			c = _GUI.container,
			parent;
		
		_GUI.fullscreen_api.requestFullScreen( c.domElement.get( 0 ) );
		
		parent = b.fullscreenEnter.parent;
		
		b.fullscreenEnter.hide( { 
			remove: true,
			callback: function () {
				b.fullscreenExit.show( { parent: parent } );
			}
		} );
		
		document.addEventListener( _GUI.fullscreen_api.fullScreenEventName, on_fullscreen_changed );
		
	}
	
	function on_fullscreen_changed () {
		
		if ( _GUI.fullscreen_api.isFullScreen() !== true ) {
			
			fullscreen_exit();
			
		}
		
	}
	
	function fullscreen_exit () {
		
		var b = _GUI.buttons,
			c = _GUI.container,
			parent;
		
		document.removeEventListener( _GUI.fullscreen_api.fullScreenEventName, on_fullscreen_changed );
			
		_GUI.fullscreen_api.cancelFullScreen( c.domElement.get( 0 ) );
		
		parent = b.fullscreenExit.parent;
		
		b.fullscreenExit.hide( {
			remove: true, 
			callback: function () {
				b.fullscreenEnter.show( { parent: parent } );
			}
		} );
		
	}
	
	/*===================================================
    
    ui groups
    
    =====================================================*/
	
	function show_group ( groupName, parameters ) {
		
		var i, l,
			group,
			children,
			parents,
			child,
			parent,
			parametersChild;
		
		if ( _GUI.groups.hasOwnProperty( groupName ) ) {
			
			group = _GUI.groups[ groupName ];
			
			children = group.children;
			parents = group.parents;
			
			for ( i = 0, l = children.length; i < l; i++ ) {
				
				child = children[ i ];
				parent = parents[ i ];
				
				parametersChild = main.extend( parameters, {} );
				parametersChild.parent = parametersChild.parent || parent;
				
				child.show( parametersChild );
				
			}
			
		}
		
	}
	
	function hide_group ( groupName, parameters ) {
		
		var i, l,
			group,
			children,
			child;
		
		if ( _GUI.groups.hasOwnProperty( groupName ) ) {
			
			group = _GUI.groups[ groupName ];
			
			children = group.children;
			
			for ( i = 0, l = children.length; i < l; i++ ) {
				
				child = children[ i ];
				
				child.hide( parameters );
				
			}
			
		}
		
	}
	
	function add_to_group ( groupName, childParentPairs ) {
		
		var i, l,
			pair,
			child,
			parent,
			group,
			index;
		
		childParentPairs = main.ensure_array( childParentPairs );
		
		for ( i = 0, l = childParentPairs.length; i < l; i++ ) {
			
			pair = childParentPairs[ i ];
			
			child = pair.child;
			
			parent = pair.parent;
			
			// add to active list
			
			index = _GUI.active.indexOf( child );
			
			if ( index === -1 ) {
				
				_GUI.active.push( child );
				
			}
			
			if ( typeof groupName === 'string' ) {
				
				// if group does not exist, create
				
				if ( _GUI.groups.hasOwnProperty( groupName ) === false ) {
					
					_GUI.groupsNames.push( groupName );
					_GUI.groups[ groupName ] = {
						children: [],
						parents: []
					};
					
				}
				
				group = _GUI.groups[ groupName ];
				
				index = group.children.indexOf( child );
				
				if ( index === -1 ) {
					
					group.children.push( child );
					group.parents.push( parent );
					
				}
				
			}
			
		}
		
	}
	
	function remove_from_group ( groupName, uielements ) {
		
		var i, l,
			j, k,
			uielement,
			group,
			index;
		
		// search specific group
		
		if ( _GUI.groups.hasOwnProperty( groupName ) ) {
					
			uielements = main.ensure_array( uielements );
			
			for ( i = 0, l = uielements.length; i < l; i++ ) {
				
				uielement = uielements[ i ];
				
				group = _GUI.groups[ groupName ];
				
				index = group.children.indexOf( uielement );
				
				// if found, remove from group
				
				if ( index !== -1 ) {
					
					group.children.splice( index, 1 );
					group.parents.splice( index, 1 );
					
					// if nothing left in group, delete group
					
					if ( group.children.length === 0 ) {
						
						index = _GUI.groupsNames.indexOf( groupName );
						
						if ( index !== -1 ) {
							
							_GUI.groupsNames.splice( index, 1 );
							
						}
						
						delete _GUI.groups[ groupName ];
						
					}
					
				}
				
			}
			
		}
		else {
			
			// search for and remove from all groups
			
			for ( i = _GUI.groupsNames.length - 1; i >= 0; i-- ) {
				
				remove_from_group( uielements, _GUI.groupsNames[ i ] );
				
			}
			
		}
		
	}
	
	function clean_groups ( groupsNames, parameters ) {
		
		var i, l,
			groupName,
			group,
			uielement;
		
		groupsNames = main.ensure_array( groupsNames );
		
		// if no group names passed, default to all groups
		
		if ( groupsNames.length === 0 ) {
			
			groupsNames = _GUI.groupsNames.slice( 0 );
			
		}
		
		// clean each group
		
		for ( i = 0, l = groupsNames.length; i < l; i++ ) {
			
			groupName = groupsNames[ i ];
			
			if ( _GUI.groups.hasOwnProperty( groupName ) ) {
				
				group = _GUI.groups[ groupName ];
				
				for ( i = 0, l = group.children.length; i < l; i++ ) {
					
					uielement = group.children[ i ];
					
					uielement.hide( parameters );
					
				}
				
				remove_from_group( groupName, group.children );
				
			}
			
		}
		
	}
	
} (KAIOPUA) );