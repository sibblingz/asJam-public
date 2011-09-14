package superTests
{

public class ParentClass extends GrandParentClass 
{
	public var pstring="P";
	public function ParentClass(pText:String):void {
		super(pText);
		pstring="ParentClass "+pText;
	}

	public function getPString():String {
		return pstring;
	}
	
	public override function getGStringOverride():String {
		return gstring+ " overriden by " +pstring;
	}
}	// class ParentClass

}	// package