/*
 *
 * GridElementLibrary.js
 * List of all grid elements.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/puzzles/GridElementLibrary.js",
		_GridElementLibrary = {},
		_GridElement;
	
	/*===================================================
    
    public
    
    =====================================================*/
	
	main.asset_register( assetPath, { 
		data: _GridElementLibrary,
		requirements: [
			"assets/modules/puzzles/GridElement.js"
		],
		callbacksOnReqs: init_internal,
		wait: true
	} );
	
	/*===================================================
    
    init
    
    =====================================================*/
	
	function init_internal( ge ) {
		console.log( 'internal GridElementLibrary' );
		var shape,
			skin,
			data,
			$buttons;
		
		_GridElement = ge;
		
		// functions
		
		_GridElementLibrary.build = build;
		
		// properties
		
		_GridElementLibrary.shapeNames = [];
		_GridElementLibrary.shapes = {};
		_GridElementLibrary.skinNames = [];
		_GridElementLibrary.skins = {};
		
		// shapes
		
		// monomino
		
		_GridElementLibrary.shapes[ 'monomino' ] = {
			layout: [ [ 1 ] ]
		};
		
		// domino
		
		_GridElementLibrary.shapes[ 'domino' ] = {
			layout: [
				[ 0, 1, 0 ],
				[ 0, 1, 0 ],
				[ 0, 0, 0 ]
			]
		};
		
		// tromino
		
		_GridElementLibrary.shapes[ 'trominoi' ] = {
			layout: [
				[ 0, 1, 0 ],
				[ 0, 1, 0 ],
				[ 0, 1, 0 ]
			]
		};
		_GridElementLibrary.shapes[ 'trominol' ] = {
			layout: [
				[ 0, 1, 0 ],
				[ 0, 1, 1 ],
				[ 0, 0, 0 ]
			]
		};
		
		// tetromino
		
		_GridElementLibrary.shapes[ 'tetrominoj' ] = {
			layout: [
				[ 0, 1, 0 ],
				[ 0, 1, 0 ],
				[ 1, 1, 0 ]
			]
		};
		_GridElementLibrary.shapes[ 'tetrominol' ] = {
			layout: [
				[ 0, 1, 0 ],
				[ 0, 1, 0 ],
				[ 0, 1, 1 ]
			]
		};
		_GridElementLibrary.shapes[ 'tetrominos' ] = {
			layout: [
				[ 0, 1, 1 ],
				[ 1, 1, 0 ],
				[ 0, 0, 0 ]
			]
		};
		_GridElementLibrary.shapes[ 'tetrominoz' ] = {
			layout: [
				[ 1, 1, 0 ],
				[ 0, 1, 1 ],
				[ 0, 0, 0 ]
			]
		};
		_GridElementLibrary.shapes[ 'tetrominot' ] = {
			layout: [
				[ 1, 1, 1 ],
				[ 0, 1, 0 ],
				[ 0, 0, 0 ]
			]
		};
		_GridElementLibrary.shapes[ 'tetrominoo' ] = {
			layout: [
				[ 0, 1, 1 ],
				[ 0, 1, 1 ],
				[ 0, 0, 0 ]
			]
		};
		_GridElementLibrary.shapes[ 'tetrominoi' ] = {
			layout: [
				[ 0, 0, 1, 0 ],
				[ 0, 0, 1, 0 ],
				[ 0, 0, 1, 0 ],
				[ 0, 0, 1, 0 ]
			]
		};
		
		// for each shape
		
		for ( shape in _GridElementLibrary.shapes ) {
			
			if ( _GridElementLibrary.shapes.hasOwnProperty( shape ) ) {
				
				// get data
				
				data = _GridElementLibrary.shapes[ shape ];
				
				// properties
				
				data.shape = shape;
				
				// store name in list
				
				_GridElementLibrary.shapeNames.push( shape );
				
				// disable and hide all buttons
				
				$buttons = data.$buttons = $( ".shape-" + shape ).addClass( "disabled hidden" ).data( 'shape', shape );
				data.$buttonsPuzzleActive = shared.domElements.$puzzleActiveShapes.find( $buttons );
				data.$buttonsShapePicker = shared.domElements.$puzzleActiveShapesPicker.find( $buttons );
				data.picked = false;
				
			}
			
		}
		
		// skins
		
		_GridElementLibrary.skins[ 'taro' ] = {
			container: {
				geometry: 'assets/models/Plant_Dirt_Mound.js'
			},
			customizations: {
				geometry: 'assets/models/Plant_Taro.js'
			}
		};
		
		_GridElementLibrary.skins[ 'pineapple' ] = {
			customizations: {
				geometry: 'assets/models/Plant_Pineapple.js'
			}
		};
		
		_GridElementLibrary.skins[ 'rock' ] = {
			customizations: {
				geometry: 'assets/models/Plant_Rock.js'
			}
		};
		
		// for each skin
		
		for ( skin in _GridElementLibrary.skins ) {
			
			if ( _GridElementLibrary.skins.hasOwnProperty( skin ) ) {
				
				// get data
				
				data = _GridElementLibrary.skins[ skin ];
				
				// properties
				
				data.skin = skin;
				data.geometry = data.geometry || 'assets/models/Plant_Seed.js';
				
				// store name in list
				
				_GridElementLibrary.skinNames.push( skin );
				
				// TODO: disable and hide all buttons
				
				//$buttons = data.$buttons = $( ".skin-" + skin ).addClass( "disabled hidden" ).data( 'skin', skin );
				//data.$buttonsPuzzleActive = shared.domElements.$puzzleActiveShapes.find( $buttons );
				//data.$buttonsShapePicker = shared.domElements.$puzzleActiveShapesPicker.find( $buttons );
				
			}
			
		}
		
	}
	
	/*===================================================
    
    build
    
    =====================================================*/
	
	function build ( parameters ) {
		
		var shapeName,
			skinName,
			gridElement;
		
		// handle parameters
		
		parameters = parameters || {};
		
		shapeName = _GridElementLibrary.shapes.hasOwnProperty( parameters.shape ) ? parameters.shape.toLowerCase() : 'monomino';
		skinName = _GridElementLibrary.skins.hasOwnProperty( parameters.skin ) ? parameters.skin.toLowerCase() : 'taro';
		
		// copy parameters
		
		parameters = main.extend( _GridElementLibrary.shapes[ shapeName ], parameters );
		parameters = main.extend( _GridElementLibrary.skins[ skinName ], parameters );
		console.log( 'BUILD GRID ELEMENT', parameters );
		gridElement = new _GridElement.Instance( parameters );
		gridElement.libraryNames = {
			shape: shapeName,
			skin: skinName
		};
		
		
		return gridElement;
		
	}
	
} (KAIOPUA) );