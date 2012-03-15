package sides {
	import flash.display.MovieClip;
	import flash.events.Event;
	
	public class LeftCenter extends MovieClip{

		public function LeftCenter() {
			// constructor code
			super();
			this.stage.addEventListener(Event.RESIZE, this.onResize);
		}
		public function onResize(event:Event){
			var scale = Math.sqrt( stage.stageWidth*stage.stageHeight / (960*640) );
			this.scaleX = this.scaleY = scale;
			this.x = 0;
			this.y = stage.stageHeight/2;
		}
	}
	
}

