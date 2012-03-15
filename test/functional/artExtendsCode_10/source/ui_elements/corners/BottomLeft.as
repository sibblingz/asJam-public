package corners {
	import flash.display.MovieClip;
	import flash.events.Event;
	
	public class BottomLeft extends ResizeableElement{

		public function BottomLeft() {
			super();
		}
		override public function resize(stageWidth, stageHeight){
			var scale = Math.sqrt( stageWidth*stageHeight / (960*640) );
			this.scaleX = this.scaleY = scale;
			this.x = 0;
			this.y = stageHeight;
		}
	}
	
}

