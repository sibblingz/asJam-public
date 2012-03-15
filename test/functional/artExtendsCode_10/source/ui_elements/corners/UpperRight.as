package corners {
	import flash.display.MovieClip;
	import flash.events.Event;
	
	public class UpperRight extends ResizeableElement{

		public function UpperRight() {
			super();
		}
		override public function resize(stageWidth, stageHeight){
			var scale = Math.sqrt( stageWidth*stageHeight / (960*640) );
			this.scaleX = this.scaleY = scale;
			this.x = stageWidth;
			this.y = 0;
		}
	}
	
}

