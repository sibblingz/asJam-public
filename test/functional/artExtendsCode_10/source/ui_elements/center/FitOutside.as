package center {
	import flash.display.MovieClip;
	import flash.events.Event;
	
	public class FitOutside extends ResizeableElement{

		public function FitOutside() {
			// constructor code
			super();
		}
		override public function resize(stageWidth, stageHeight){
			var scale = Math.max( stageWidth/960, stageHeight/640 );
			this.scaleX = this.scaleY = scale;
			this.x = stageWidth/2;
			this.y = stageHeight/2;
		}
	}
	
}

