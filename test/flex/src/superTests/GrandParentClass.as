package superTests
{

public class GrandParentClass
{
	public var gstring:String="G";
	public function GrandParentClass(pText:String):void {
		gstring="GrandParentClass " + pText;
	}

	public function getGString():String {
		return gstring;
	}
	
	public function getGStringOverride():String {
		return gstring+ " override";
	}
	
}	// class GrandParentClass

}	// package