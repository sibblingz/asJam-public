package interfaceTests
{
	public interface IMonster extends IFoobar
	{
		function getShot(damage:uint):void;
		function getCanShoot():Boolean;
	}
}
