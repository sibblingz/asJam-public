package static_references
{
	public class StaticReference
	{
		public static var backgroundArtwork:*;
		
		public function StaticReference()
		{
			initBg();
		}
		
		private function initBg():void{
			var backgroundArtwork = new backgroundArtwork();
		}
	}
}