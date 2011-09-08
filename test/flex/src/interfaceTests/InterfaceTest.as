package interfaceTests
{
	import interfaceTests.MovieClip;

	
	public class InterfaceTest extends MovieClip implements IMonster{
		var health=100;
		public function InterfaceTest()
		{
			if(getCanShoot())
				getShot(50);
			Assert.equal(health, 50);
		}
		
		public function getShot(damage:uint):void
		{
			health= health - damage;
		}

		public  function getCanShoot():Boolean{
			return true;
		}

	}
}
