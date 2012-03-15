package corners {
	import flash.display.MovieClip;
	import flash.events.Event;
	
	public class UpperLeft extends ResizeableElement{

		public function UpperLeft() {
			super();
		}
		override public function resize(stageWidth, stageHeight){
			var scale = Math.sqrt( stageWidth*stageHeight / (960*640) );
			this.scaleX = this.scaleY = scale;
			this.x = 0;
			this.y = 0;
		}
	}
	
}

