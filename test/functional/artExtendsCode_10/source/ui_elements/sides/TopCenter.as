﻿package sides {
	import flash.display.MovieClip;
	import flash.events.Event;
	
	public class TopCenter extends MovieClip{

		public function TopCenter() {
			// constructor code
			super();
			this.stage.addEventListener(Event.RESIZE, this.onResize);
		}
		public function onResize(event:Event){
			var scale = Math.sqrt( stage.stageWidth*stage.stageHeight / (960*640) );
			this.scaleX = this.scaleY = scale;
			this.x = stage.stageWidth/2;
			this.y = 0;
		}
	}
	
}

