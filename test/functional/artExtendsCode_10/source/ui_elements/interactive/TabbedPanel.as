package interactive {
	import flash.display.MovieClip;
	import flash.events.MouseEvent;
	
	public class TabbedPanel extends MovieClip{
		
		private var tabs = [];
		private var tabNames = [];
		private var panels = [];
		private var currentPanel = 0;
		
		public function TabbedPanel() {
			// constructor code
			super();
			return;
			this.setup();
			if( this.numPanels > 0 ){
				this.setCurrentPanel(0);
			}
		}
		
		public function get numPanels(){
			return this.panels.length;
		}
		
		public function get numTabs(){
			return this.numPanels;
		}
		
		private function setup(){
			for( var i = 0; i < this.numChildren; i++ ){
				var child = this.getChildAt(i);
				if( !child.name ){
					continue;
				}
				var matchData = child.name.match(/(.*)Tab$/);
				if( !matchData ){
					continue;
				}
				var tabName = matchData[1];
				var panel = this.getChildByName( tabName + "Panel" );
				if( !panel ){
					continue;
				}
				panel.visible = false;
				
				this.tabs.push( child );
				this.tabNames.push( tabName );
				this.panels.push( panel );
			}
			
			var self = this;
			this.tabs.forEach( function(tabButton, i){
				tabButton.onClick = function(){
					self.setCurrentPanel(i)
				}
			});
		}
		
		private function hidePanelByIndex(index){
			var panel = this.panels[index];
			panel.visible = false;
		}
		
		private function showPanelByIndex(index){
			var panel = this.panels[index];
			panel.visible = true;
		}
		
		private function setCurrentPanel(index){
			this.hidePanelByIndex(this.currentPanel);
			this.showPanelByIndex(index);
			this.currentPanel = index;
		}
	}
	
}
