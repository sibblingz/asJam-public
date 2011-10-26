package com.bitrhymes.salon.controllers
{
	/**
	 * 
	 * defines functions that need to be implemented by an object which wishes to receive timer updates from <code>TimerController</code> 
	 * @author Sano
	 * 
	 */	
	public interface ITimerEventListener
	{
		function onTimer(time:Number):void;
	}
}