/**
 * Enemy AI - Patrol
 * ---------------------
 * VERSION: 1.0
 * DATE: 5/04/2011
 * AS3
 * UPDATES AND DOCUMENTATION AT: http://www.FreeActionScript.com
 **/
package  
{
	import flash.display.MovieClip;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.geom.Point;
	
	public class Main extends MovieClip
	{
		// player settings		
		private var _moveSpeedMax:Number = 3;
		private var _moveSpeedCurrent:Number = 0;
		private var _acceleration:Number = .05;
		
		private var _rotateSpeedMax:Number = 10;
		
		private var _destinationX:int;
		private var _destinationY:int;
		
		private var _minX:Number = 0;
		private var _minY:Number = 0;
		private var _maxX:Number = 550;
		private var _maxY:Number = 400;
		
		// partol points
		private var _patrolPoints:Array;
		private var _currentPoint:int = 0;
		private var _directionChangeProximity:Number = 5;
		private var _distance:Number;
		
		// player
		private var _player:MovieClip;
		
		// global		
		private var _dx:Number = 0;
		private var _dy:Number = 0;		
		private var _vx:Number = 0;
		private var _vy:Number = 0;
		
		private var _trueRotation:Number = 0;
		
		/**
		 * Constructor
		 */
		public function Main() 
		{
			// create player object
			createPlayer();
			
			// sets default patrol points
			setPatrolPoints();
			
			// adds patrol point markers
			setPatrolPointMarkers();
			
			// add listeners
			stage.addEventListener(Event.ENTER_FRAME, enterFrameHandler);
		}
		
		/**
		 * Creates player
		 */
		private function createPlayer():void
		{			
			_player = new Player();
			_player.x = stage.stageWidth / 2;
			_player.y = stage.stageHeight / 2;
			stage.addChild(_player);
		}
		
		/**
		 * Sets default patrol points
		 */
		private function setPatrolPoints():void
		{
			// create new array
			_patrolPoints = [];
			
			// add new patrol points
			_patrolPoints.push(new Point(100, 75));
			_patrolPoints.push(new Point(375, 100));
			_patrolPoints.push(new Point(425, 250));
			_patrolPoints.push(new Point(300, 350));
			
			// set first destination
			getNextDestination();
		}
		
		/**
		 * Creates patrol point markers
		 */
		private function setPatrolPointMarkers():void
		{			
			for (var i:int = 0; i < _patrolPoints.length; i++)
			{
				var tempMarker:MovieClip = new Marker();
				
				tempMarker.x =  _patrolPoints[i].x;
				tempMarker.y =  _patrolPoints[i].y;
				
				addChild(tempMarker);
			}
		}
		
		/**
		 * EnterFrame Handlers
		 */
		private function enterFrameHandler(event:Event):void
		{
			updateCollision();
			updatePosition();
			updateRotation();
		}
		
		/**
		 * Calculate Rotation
		 */
		private function updateRotation():void
		{
			// calculate rotation
			_dx = _player.x - _destinationX;
			_dy = _player.y - _destinationY;
			
			// which way to rotate
			var rotateTo:Number = getDegrees(getRadians(_dx, _dy));	
			
			// keep rotation positive, between 0 and 360 degrees
			if (rotateTo > _player.rotation + 180) rotateTo -= 360;
			if (rotateTo < _player.rotation - 180) rotateTo += 360;
			
			// ease rotation
			_trueRotation = (rotateTo - _player.rotation) / _rotateSpeedMax;
			
			// update rotation
			_player.rotation += _trueRotation;
		}
		
		/**
		 * Calculate Position
		 */
		private function updatePosition():void
		{
			// if close to target
			if (getDistance(_dx, _dy) < _directionChangeProximity)
			{
				getNextDestination();
			}
			
			// get distance
			_distance = getDistance(_destinationX - _player.x, _destinationY - _player.y);
			
			// update speed (accelerate/slow down) based on distance
			if (_distance >= 50)
			{
				_moveSpeedCurrent += _acceleration;
				
				if (_moveSpeedCurrent > _moveSpeedMax)
				{
					_moveSpeedCurrent = _moveSpeedMax;
				}
			}
			else if (_distance < 30)
			{
				_moveSpeedCurrent *= .90;
			}
			
			// update velocity
			_vx = (_destinationX - _player.x) / _distance * _moveSpeedCurrent;
			_vy = (_destinationY - _player.y) / _distance * _moveSpeedCurrent;
			
			// update position
			_player.x += _vx;
			_player.y += _vy;
		}
		
		/**
		 * updateCollision
		 */
		protected function updateCollision():void
		{
			// Check X
			// Check if hit top
			if (((_player.x - _player.width / 2) < _minX) && (_vx < 0))
			{
			  _vx = -_vx;
			}
			// Check if hit bottom
			if ((_player.x + _player.width / 2) > _maxX && (_vx > 0))
			{
			  _vx = -_vx;
			}
			
			// Check Y
			// Check if hit left side
			if (((_player.y - _player.height / 2) < _minY) && (_vy < 0))
			{
			  _vy = -_vy
			}
			// Check if hit right side
			if (((_player.y + _player.height / 2) > _maxY) && (_vy > 0))
			{
			  _vy = -_vy;
			}
		}
		
		/**
		 * Gets next destination from _patrolPoints array
		 */
		private function getNextDestination():void
		{
			_destinationX = _patrolPoints[_currentPoint].x;
			_destinationY = _patrolPoints[_currentPoint].y;
			
			_currentPoint++;
			
			if (_currentPoint == _patrolPoints.length)
			{
				_currentPoint = 0;
			}
		}
		
		/**
		 * Get distance
		 * @param	delta_x
		 * @param	delta_y
		 * @return
		 */
		public function getDistance(delta_x:Number, delta_y:Number):Number
		{
			return Math.sqrt((delta_x*delta_x)+(delta_y*delta_y));
		}
		
		/**
		 * Get radians
		 * @param	delta_x
		 * @param	delta_y
		 * @return
		 */
		public function getRadians(delta_x:Number, delta_y:Number):Number
		{
			var r:Number = Math.atan2(delta_y, delta_x);
			
			if (delta_y < 0)
			{
				r += (2 * Math.PI);
			}
			return r;
		}
		
		/**
		 * Get degrees
		 * @param	radians
		 * @return
		 */
		public function getDegrees(radians:Number):Number
		{
			return Math.floor(radians/(Math.PI/180));
		}
		
	}
	
}
