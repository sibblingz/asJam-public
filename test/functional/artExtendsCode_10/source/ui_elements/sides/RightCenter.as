package sides {
	import flash.display.MovieClip;
	import flash.events.Event;
	
	public class RightCenter extends MovieClip{

		public function RightCenter() {
			// constructor code
			super();
			this.stage.addEventListener(Event.RESIZE, this.onResize);
		}
		public function onResize(event:Event){
			var scale = Math.sqrt( stage.stageWidth*stage.stageHeight / (960*640) );
			this.scaleX = this.scaleY = scale;
			this.x = stage.stageWidth;
			this.y = stage.stageHeight/2;
		}
	}
	
}

