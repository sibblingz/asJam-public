package interactive {
	import flash.display.MovieClip;
	import flash.events.MouseEvent;
	import flash.events.TouchEvent;
	import flash.geom.Point;
	
	public class ZoomPanel extends MovieClip {
		
		private var touchBeginLocations = {};
		private var touchLocations = {};
		private var beginZoom;
		private var beginAverageRadius;
		private var inputCenterOfMass;
		private var beginCoords;
		private var counter = 0;
		
		public function ZoomPanel() {
			// constructor code
			super();
			return;
			this.addEventListener( MouseEvent.MOUSE_DOWN, this.onInputBegin );
			this.addEventListener( TouchEvent.TOUCH_BEGIN, this.onInputBegin );
		}
		
		public function onInputBegin(event){
			var tpID = (event is TouchEvent) ? event.touchPointID : 0;
			var inputLocation = new Point(event.stageX, event.stageY);
			this.touchLocations[tpID] = inputLocation;
			
			this.resetInputBeginState();
			
			this.stage.addEventListener( MouseEvent.MOUSE_MOVE, this.onInputMove, true );
			this.stage.addEventListener( TouchEvent.TOUCH_MOVE, this.onInputMove, true );
				
			this.stage.addEventListener( MouseEvent.MOUSE_UP, this.onInputEnd, true );
			this.stage.addEventListener( TouchEvent.TOUCH_END, this.onInputEnd, true );
		}
		
		public function onInputMove(event){
			event.stopImmediatePropagation();
			
			var key;
			var tpID = (event is TouchEvent) ? event.touchPointID : 0;
			var inputLocation = new Point(event.stageX, event.stageY);
			this.touchLocations[tpID] = inputLocation;
			
			var tempCenterOfMass = new Point();
			var numInputs = 0;
			for( key in this.touchLocations ){
				numInputs += 1;
				tempCenterOfMass = tempCenterOfMass.add( this.touchLocations[key] );
			}
			tempCenterOfMass.x /= numInputs;
			tempCenterOfMass.y /= numInputs;
			
			var tempAverageRadius = 0;
			for( key in this.touchLocations ){
				tempAverageRadius += tempCenterOfMass.subtract( this.touchLocations[key] ).length;
			}
			tempAverageRadius /= numInputs;
			
			var delta = tempCenterOfMass.subtract( this.inputCenterOfMass );
			this.x = this.beginCoords.x + delta.x;
			this.y = this.beginCoords.y + delta.y;
			
			if( numInputs > 1 ){
				var tempZoom = this.beginZoom*tempAverageRadius/this.beginAverageRadius;
				this.scaleX = this.scaleY = tempZoom;
			}
		}
		
		public function onInputEnd(event){
			var tpID = (event is TouchEvent) ? event.touchPointID : 0;
			delete this.touchBeginLocations[tpID];
			delete this.touchLocations[tpID];
			
			this.resetInputBeginState();
			
			this.stage.removeEventListener( MouseEvent.MOUSE_MOVE, this.onInputMove, true );
			this.stage.removeEventListener( TouchEvent.TOUCH_MOVE, this.onInputMove, true );
			
			this.stage.removeEventListener( MouseEvent.MOUSE_UP, this.onInputEnd, true );
			this.stage.removeEventListener( TouchEvent.TOUCH_END, this.onInputEnd, true );
		}
		
		private function resetInputBeginState(){
			var key;
			for( key in this.touchLocations ){
				this.touchBeginLocations[key] = this.touchLocations[key].clone();
			}
			
			this.inputCenterOfMass = new Point();
			var numInputs = 0;
			for( key in this.touchBeginLocations ){
				numInputs += 1;
				this.inputCenterOfMass = this.inputCenterOfMass.add( this.touchBeginLocations[key] );
			}
			this.inputCenterOfMass.x /= numInputs;
			this.inputCenterOfMass.y /= numInputs;
			
			this.beginAverageRadius = 0;
			for( key in this.touchBeginLocations ){
				this.beginAverageRadius += this.inputCenterOfMass.subtract( this.touchBeginLocations[key] ).length;
			}
			this.beginAverageRadius /= numInputs;
			
			this.beginZoom = this.scaleX;
			this.beginCoords = new Point(this.x, this.y);
		}
	}
	
}

