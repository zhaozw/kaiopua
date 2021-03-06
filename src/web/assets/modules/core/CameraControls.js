/*
 *
 * CameraControls.js
 * Adds additional functionality to basic camera.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/core/CameraControls.js",
		_CameraControls = {},
		_ObjectHelper,
		_MathHelper,
		_VectorHelper,
		_PhysicsHelper;
	
	/*===================================================
    
    public properties
    
    =====================================================*/
	
	main.asset_register( assetPath, { 
		data: _CameraControls,
		requirements: [
			"assets/modules/utils/ObjectHelper.js",
			"assets/modules/utils/MathHelper.js",
			"assets/modules/utils/VectorHelper.js",
			"assets/modules/utils/PhysicsHelper.js"
		],
		callbacksOnReqs: init_internal,
		wait: true
	});
	
	/*===================================================
    
	internal init
    
    =====================================================*/
	
	function init_internal ( oh, mh, vh, ph ) {
		console.log('internal cameracontrols');
		// assets
		
		_ObjectHelper = oh;
		_MathHelper = mh;
		_VectorHelper = vh;
		_PhysicsHelper = ph;
		
		// instance
		
		_CameraControls.Instance = CameraControls;
		
		_CameraControls.Instance.prototype.modify = modify;
		_CameraControls.Instance.prototype.reset = reset;
		
		_CameraControls.Instance.prototype.rotate = rotate;
		_CameraControls.Instance.prototype.zoom = zoom;
		_CameraControls.Instance.prototype.update = update;
		
		Object.defineProperty( _CameraControls.Instance.prototype, 'camera', { 
			get : function () { return this._camera; },
			set : function ( camera ) {
				
				if ( typeof camera !== 'undefined' ) {
					
					this._camera = camera;
					
					this._camera.useQuaternion = true;
					this._camera.quaternion.setFromRotationMatrix( this._camera.matrix );
					
				}
				
			}
		});
		
		Object.defineProperty( _CameraControls.Instance.prototype, 'target', { 
			get : function () { return this._target; },
			set : function ( target ) {
				
				this._target = target;
				
				this.boundRadius = this._target instanceof THREE.Object3D ? this._target.boundRadius : this.options.boundRadiusBase;
				this.boundRadiusPct = _MathHelper.clamp( this.boundRadius / this.options.boundRadiusBase, this.options.boundRadiusPctMin, this.options.boundRadiusPctMax );
				
			}
		});
		
		Object.defineProperty( _CameraControls.Instance.prototype, 'enabled', { 
			get : function () { return this._enabled; },
			set : function ( enabled ) {
				
				var enabledPrev = this._enabled;
				
				this._enabled = enabled;
				
				if ( this._enabled === true && enabledPrev !== true ) {
					
					this.position.copy( this.camera.position );
					this.rotationTarget.copy( this.camera.quaternion );
					
				}
				
			}
		} );
		
		Object.defineProperty( _CameraControls.Instance.prototype, 'controllable', { 
			get : function () { return this._controllable; },
			set : function ( controllable ) {
				
				this._controllable = controllable;
				
				if ( this._controllable === true ) {
					
					shared.signals.onGamePointerDragStarted.add( rotate_start, this );
					shared.signals.onGamePointerDragged.add( this.rotate, this );
					shared.signals.onGamePointerDragEnded.add( rotate_stop, this );
					shared.signals.onGamePointerWheel.add( this.zoom, this );
					
				}
				else {
					
					shared.signals.onGamePointerDragStarted.remove( rotate_start, this );
					shared.signals.onGamePointerDragged.remove( this.rotate, this );
					shared.signals.onGamePointerDragEnded.remove( rotate_stop, this );
					shared.signals.onGamePointerWheel.remove( this.zoom, this );
					
				}
				
			}
		});
		
	}
	
	/*===================================================
    
	external init
    
    =====================================================*/
	
	function CameraControls ( camera, target, parameters ) {
		
		// utility
		
		this.utilVec31Update = new THREE.Vector3();
		this.utilVec32Update = new THREE.Vector3();
		this.utilQ31Update = new THREE.Quaternion();
		this.utilQ32Update = new THREE.Quaternion();
		
		this.position = new THREE.Vector3();
		
		this.up = shared.cardinalAxes.up.clone();
		this.forward = shared.cardinalAxes.forward.clone();
		
		this.positionBase = new THREE.Vector3();
		this.positionBaseTarget = new THREE.Vector3();
		this.positionMove = new THREE.Vector3();
		this.positionOffset = new THREE.Vector3();
		this.positionOffsetTarget = new THREE.Vector3();
		
		this.rotating = false;
		this.rotateTarget = false;
		this.rotationOffset = new THREE.Quaternion();
		this.rotationOffsetTarget = new THREE.Quaternion();
		this.rotationConstrained = new THREE.Vector3();
		this.rotationBase = new THREE.Vector3( -Math.PI * 0.2, Math.PI, 0 );
		this.rotationRotated = new THREE.Vector3();
		this.rotationRotatedLast = new THREE.Vector3();
		this.rotationRotatedDelta = new THREE.Vector3();
		this.rotationTotal = new THREE.Vector3();
		this.rotationDelta = new THREE.Vector3();
		this.rotationDeltaTotal = new THREE.Vector3();
		this.rotationTarget = new THREE.Quaternion();
		this.rotationCamera = new THREE.Quaternion();
		
		this.distanceNormal = new THREE.Vector3();
		this.distanceMagnitude = new THREE.Vector3();
		
		// options
		
		this.defaults = {};
		
		this.defaults.cameraLerpDeltaWhenNewGrow = 0.02;
		
		this.defaults.positionBaseX = 0;
		this.defaults.positionBaseY = 0;
		this.defaults.positionBaseZ = 0;
		this.defaults.positionBaseSpeed = 0.1;
		this.defaults.positionOffsetSpeed = 0.1;
		this.defaults.positionOffsetSpeedWhenNew = 0.05;
		this.defaults.boundRadiusBase = 500;
		this.defaults.boundRadiusModMin = 1.25;
		this.defaults.boundRadiusModMax = 3;
		this.defaults.boundRadiusModSpeed = 0.001;
		this.defaults.boundRadiusPctMin = 0.25;
		this.defaults.boundRadiusPctMax = 1;
		
		this.defaults.rotationMaxX = Math.PI * 0.5; // not using quaternions, so above 0.5 on X will appear to reverse y rotation
		this.defaults.rotationMinX= -Math.PI * 0.5;
		this.defaults.rotationMaxY = Math.PI;
		this.defaults.rotationMinY = -Math.PI;
		this.defaults.rotationSpeed = 0.1;
		this.defaults.rotationSpeedDelta = 0.001;
		this.defaults.rotationReturnDecay = 0.8;
		this.defaults.rotationDeltaDecay = 0.8;
		
		this.defaults.distanceThresholdMin = 1;
		this.defaults.distanceThresholdPct = 0.35;
		this.defaults.distanceSpeedPctMax = 0.25;
		this.defaults.distanceSpeedPctMin = 0.01;
		this.defaults.distanceSpeedPctAlphaGrow = 0.025;
		this.defaults.distanceSpeedPctAlphaShrink = 0.1;
		this.defaults.distanceSpeedPctWhenNew = 0;
		this.defaults.distanceSpeedPctWhenNewGrow = 0.0005;
		
		this.reset();
		this.modify( parameters );
		
		// properties
		
		this.cameraLerpDelta = 0.1;
		this.cameraLerpDeltaWhenNew = 0;
		this.distanceThresholdPassed = false;
		this.distanceThresholdMax = this.positionOffset.length() * this.options.distanceThresholdPct;
		this.distanceSpeed = 0;
		this.distanceSpeedPct = this.options.distanceSpeedPctMin;
		this.boundRadius = this.options.boundRadiusBase;
		this.boundRadiusPct = this.options.boundRadiusPctMax;
		this.boundRadiusMod = this.options.boundRadiusModMax;
		
		this.camera = camera;
		this.target = this.targetLast = target;
		
		this.enabled = false;
		this.controllable = false;
		
	}
	
	/*===================================================
	
	options
	
	=====================================================*/
	
	function modify ( parameters ) {
		
		parameters = parameters || {};
		
		this.options = $.extend( this.options || {}, parameters );
		
	}
	
	function reset () {
		
		this.options = $.extend( {}, this.defaults );
		
	}
	
	/*===================================================
	
	rotate
	
	=====================================================*/
	
	function rotate ( e, pointer ) {
		
		var angle,
			sign,
			angleSign,
			angleDiff;
		
		this.rotationDelta.set( -pointer.deltaY * this.options.rotationSpeedDelta, -pointer.deltaX * this.options.rotationSpeedDelta, 0 )
		this.rotationDeltaTotal.addSelf( this.rotationDelta );
		
	}
	
	function rotate_start () {
		
		this.rotating = true;
		
	}
	
	function rotate_stop () {
		
		this.rotating = false;
		
	}
	
	function rotate_update () {
		
		var target = this._target,
			targetRotateAxis;
		
		this.rotationConstrained.copy( this.rotationBase );
		
		// while moving, return to 0 rotation offset
		
		if ( this.targetNew === true || ( target && target.moving === true && this.rotating !== true && this.rotateTarget !== true ) ) {
			
			this.rotationRotated.multiplyScalar( this.options.rotationReturnDecay );
			this.rotationConstrained.addSelf( this.rotationRotated );
			
		}
		else {
			
			this.rotationRotatedLast.copy( this.rotationRotated );
			
			this.rotationRotated.x = _MathHelper.clamp( _MathHelper.rad_between_PI( this.rotationRotated.x + this.rotationDeltaTotal.x ), this.options.rotationMinX, this.options.rotationMaxX );
			this.rotationRotated.y = _MathHelper.clamp( _MathHelper.rad_between_PI( this.rotationRotated.y + this.rotationDeltaTotal.y ), this.options.rotationMinY, this.options.rotationMaxY );
			
			// if controls should also rotate target around y axis
			
			if ( this.rotateTarget === true ) {
				
				this.rotationRotatedDelta.sub( this.rotationRotated, this.rotationRotatedLast );
				
				// rotation axis
				
				if ( target.movement && target.movement.rotate ) {
					
					targetRotateAxis = target.movement.rotate.axis;
					
				}
				else if ( target.rigidBody ) {
					
					targetRotateAxis = target.rigidBody.axes.up;
					
				}
				else {
					
					targetRotateAxis = this.up;
					
				}
				
				target.quaternion.multiplySelf( new THREE.Quaternion().setFromAxisAngle( targetRotateAxis, this.rotationRotatedDelta.y ) );
				
				// since we add the rotation delta y to the target, we only add the rotation delta x to the constrained / offset
				
				this.rotationConstrained.x += this.rotationRotated.x;
				
			}
			else {
				
				this.rotationConstrained.addSelf( this.rotationRotated );
				
			}
		
		}
		
		this.rotationConstrained.x = _MathHelper.clamp( _MathHelper.rad_between_PI( this.rotationConstrained.x ), this.options.rotationMinX, this.options.rotationMaxX );
		this.rotationConstrained.y = _MathHelper.clamp( _MathHelper.rad_between_PI( this.rotationConstrained.y ), this.options.rotationMinY, this.options.rotationMaxY );
		
		this.rotationOffsetTarget.setFromEuler( this.rotationConstrained, "YXZ" );
		this.rotationOffset.slerpSelf( this.rotationOffsetTarget, this.options.rotationSpeed );
		
		this.rotationDeltaTotal.multiplyScalar( this.options.rotationDeltaDecay );
		
	}
	
	/*===================================================
	
	zoom
	
	=====================================================*/
	
	function zoom ( e ) {
		
		var eo = e.originalEvent || e,
			wheelDelta = eo.wheelDelta;
		
		this.boundRadiusMod -= wheelDelta * ( this.options.boundRadiusModSpeed / this.boundRadiusPct );
		
	}
	
	function zoom_update() {
		
		this.boundRadiusMod = _MathHelper.clamp( this.boundRadiusMod, this.options.boundRadiusModMin / this.boundRadiusPct, this.options.boundRadiusModMax / this.boundRadiusPct );
		this.positionMove.z = this.boundRadius * this.boundRadiusMod;
		
		this.positionBaseTarget.set( this.options.positionBaseX, this.options.positionBaseY, this.options.positionBaseZ );
		this.positionBase.lerpSelf( this.positionBaseTarget, this.options.positionBaseSpeed );
		
		this.positionOffsetTarget.add( this.positionBase, this.positionMove );
		
		this.positionOffset.lerpSelf( this.positionOffsetTarget, this.targetNew === true ? this.options.positionOffsetSpeedWhenNew : this.options.positionOffsetSpeed );
		
		
	}
	
	/*===================================================
	
	update
	
	=====================================================*/
	
	function update () {
		
		var target = this._target,
			scale,
			rigidBody,
			distance,
			distanceDiff,
			distanceSpeedMod,
			distanceSpeedPctAlphaGrow,
			distanceSpeedPctAlphaShrink,
			qToNew,
			positionOffsetScaled = this.utilVec31Update,
			rotationTargetNew = this.utilQ32Update,
			cameraLerpDelta = this.cameraLerpDelta;
		
		if ( this.enabled === true ) {
			
			// handle target
			
			if ( target instanceof THREE.Object3D !== true ) {
				
				positionOffsetScaled.copy( this.positionOffset );
				
			}
			else {
				
				rigidBody = target.rigidBody;
				scale = Math.max( target.scale.x, target.scale.y, target.scale.z );
				positionOffsetScaled.copy( this.positionOffset ).multiplyScalar( scale );
				
				/*
				// make sure camera and target parents are same
				
				if ( this.camera.parent !== target.parent ) {
					
					target.parent.add( this.camera );
					
				}
				*/
				// first time target is new
				
				if ( this.targetNew !== true && target !== this.targetLast ) {
					
					this.targetNew = true;
					this.distanceSpeedPctWhenNew = 0;
					this.cameraLerpDeltaWhenNew = 0;
					
				}
				
				// get distance to target position
				
				distance = _VectorHelper.distance_to( this.position, target.position );
				
				if ( this.targetNew === true && distance - this.options.distanceThresholdMin <= this.distanceThresholdMax ) {
					
					this.targetNew = false;
					this.targetLast = target;
					this.distanceThresholdPassed = true;
					
				}
				
				// handle distance
				
				if ( distance > this.options.distanceThresholdMin ) {
					
					// update threshold max based on position offset
					
					this.distanceThresholdMax = positionOffsetScaled.length() * this.options.distanceThresholdPct;
					
					// if greater than max threshold, move with target at max distance
					
					if ( this.targetNew !== true && distance - this.options.distanceThresholdMin > this.distanceThresholdMax ) {
						
						distanceDiff = distance - this.distanceThresholdMax;
						
						// change flag
						
						this.distanceThresholdPassed = true;
						
						// update speed
						
						this.distanceSpeed = Math.max( this.distanceSpeed, distanceDiff );
						
					}
					// if distance threshold not yet passed, slow movement while target moving, speed up when stopped
					else if ( this.distanceThresholdPassed === false ) {
						
						// get speed pct
						
						if ( target.moving === true ) {
							
							this.distanceSpeedPct += ( this.options.distanceSpeedPctMin - this.distanceSpeedPct ) * this.options.distanceSpeedPctAlphaShrink;
							
						}
						else {
							
							if ( this.targetNew === true ) {
								
								distanceSpeedPctAlphaGrow = this.distanceSpeedPctWhenNew;
								this.distanceSpeedPctWhenNew = Math.min( this.options.distanceSpeedPctAlphaGrow, this.distanceSpeedPctWhenNew + this.options.distanceSpeedPctWhenNewGrow );
								
							}
							else {
								
								distanceSpeedPctAlphaGrow = this.options.distanceSpeedPctAlphaGrow;
								
							}
							
							this.distanceSpeedPct += ( this.options.distanceSpeedPctMax - this.distanceSpeedPct ) * distanceSpeedPctAlphaGrow;
							
						}
						
						// update speed
						
						this.distanceSpeed = Math.max( this.distanceSpeed, distance * this.distanceSpeedPct );
						
					}
					
					// get speed modifier
					
					distanceSpeedMod = Math.min( 1, distance / Math.max( this.distanceSpeed, this.distanceThresholdMax ) );
					
					// normal / magnitude to target
					
					this.distanceNormal.sub( target.position, this.position ).normalize();
					this.distanceMagnitude.copy( this.distanceNormal ).multiplyScalar( this.distanceSpeed * distanceSpeedMod );
					
					// update position
					
					this.position.addSelf( this.distanceMagnitude );
					
				}
				// reset position variables
				else if ( this.distanceThresholdPassed !== false ) {
					
					this.position.copy( target.position );
					this.distanceSpeed = 0;
					this.distanceThresholdPassed = false;
					
				}
				
				// get camera target rotation
				
				rotationTargetNew.copy( target.quaternion );
				
				if ( target && target.facing instanceof THREE.Quaternion ) {
					
					var antiFacing= new THREE.Quaternion().copy( target.facing ).inverse();
					rotationTargetNew.multiplySelf( antiFacing );
					
				}
				
			}
			
			// update
			
			rotate_update.call( this );
			zoom_update.call( this );
			
			// lerp camera rotation to target
			
			if ( this.targetNew === true ) {
				
				cameraLerpDelta = this.cameraLerpDeltaWhenNew;
				this.cameraLerpDeltaWhenNew = Math.min( this.cameraLerpDelta, this.cameraLerpDeltaWhenNew + ( this.cameraLerpDelta - this.cameraLerpDeltaWhenNew ) * this.options.cameraLerpDeltaWhenNewGrow );
				
			}
			
			this.rotationTarget.slerpSelf( rotationTargetNew, cameraLerpDelta );
			
			this.rotationCamera.copy( this.rotationTarget ).multiplySelf( this.rotationOffset );
			
			this.camera.quaternion.copy( this.rotationCamera );
			
			// adjust position
			
			this.camera.quaternion.multiplyVector3( positionOffsetScaled );
			
			// apply position
			
			this.camera.position.copy( this.position ).addSelf( positionOffsetScaled );
			
		}
		
	}
	
} ( KAIOPUA ) );