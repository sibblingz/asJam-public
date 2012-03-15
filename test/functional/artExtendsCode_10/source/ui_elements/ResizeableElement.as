package {
	import flash.display.MovieClip;
	import flash.events.Event;
	
	public class ResizeableElement extends MovieClip{
		public function ResizeableElement(){
			super();
			return;
			
			var self = this;
			this.addEventListener( Event.ADDED_TO_STAGE, function(event){
				event.currentTarget.removeEventListener( event.type, arguments.callee );
				
				self.stage.addEventListener(Event.RESIZE, self.onResize);
				
				resize( self.stage.stageWidth, self.stage.stageHeight );
			});
		}
		
		public function onResize(event:Event){
			var stage = event.currentTarget;
			var stageWidth = stage.stageWidth;
			var stageHeight = stage.stageHeight;
			this.resize( stageWidth, stageHeight );
		}
		
		public function resize(stageWidth, stageHeight){
			// abstract
			throw new Error("Abstract method 'onResize' should be overridden in a subclass");
		}
	}
}