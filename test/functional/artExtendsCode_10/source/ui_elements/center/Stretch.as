package center {
	import flash.display.MovieClip;
	import flash.events.Event;
	
	public class Stretch extends ResizeableElement{

		public function Stretch() {
			// constructor code
			super();
		}
		override public function resize(stageWidth, stageHeight){
			this.scaleX = stageWidth/960;
			this.scaleY = stageHeight/640;
			this.x = stageWidth/2;
			this.y = stageHeight/2;
		}
	}
	
}

