package superTests
{
import interfaceTests.MovieClip;

public class ChildClass extends ParentClass 
{
	var cstring="mc is not a String";
	public function ChildClass(mc):void {
		if(mc is String){
			cstring=mc;
		}else
			super(mc);


	}

}	// class ChildClass

}	// package