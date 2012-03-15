﻿package interactive {	import flash.display.MovieClip;	import flash.events.MouseEvent;	import flash.events.TouchEvent;		public class Button extends MovieClip{		public var onClick:Function = null;		private var touchPointID;		        public function Button() {            return;			this.gotoAndStop('up');			this.addEventListener(MouseEvent.MOUSE_DOWN, this.onInteractionBegin);			this.addEventListener(TouchEvent.TOUCH_BEGIN, this.onInteractionBegin);        }                public function onInteractionBegin(event) {			this.touchPointID = ( event is TouchEvent ) ? event.touchPointID : 0;			this.gotoAndStop("down");			this.stage.addEventListener(MouseEvent.MOUSE_UP, this.onInteractionEnd, false, 10);			this.stage.addEventListener(TouchEvent.TOUCH_END, this.onInteractionEnd, false, 10);			this.stage.addEventListener(MouseEvent.MOUSE_MOVE, this.onInteractionMove, true, 10);			this.stage.addEventListener(TouchEvent.TOUCH_MOVE, this.onInteractionMove, true, 10);			event.stopImmediatePropagation();		}		        public function onInteractionEnd(event) {			var tpID = ( event is TouchEvent ) ? event.touchPointID : 0;			if( this.touchPointID !== tpID ){				return;			}			this.gotoAndStop("up");			this.stage.removeEventListener(MouseEvent.MOUSE_UP, this.onInteractionEnd);			this.stage.removeEventListener(TouchEvent.TOUCH_END, this.onInteractionEnd);			this.stage.removeEventListener(MouseEvent.MOUSE_MOVE, this.onInteractionMove, true);			this.stage.removeEventListener(TouchEvent.TOUCH_MOVE, this.onInteractionMove, true);			if (this.onClick !== null) {				this.onClick.call();			}			event.stopImmediatePropagation();		}				public function onInteractionMove(event){			var tpID = ( event is TouchEvent ) ? event.touchPointID : 0;			if( this.touchPointID !== tpID ){				return;			}			event.stopImmediatePropagation();		}    }}