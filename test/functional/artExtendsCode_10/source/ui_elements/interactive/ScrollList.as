﻿package interactive {	import flash.display.Sprite;	import flash.display.MovieClip;	import flash.events.MouseEvent;	import flash.events.Event;	import flash.events.TouchEvent;	import flash.geom.Point;		public class ScrollList extends MovieClip{		public static var HORIZONTAL = "horizontal";		public static var VERTICAL = "vertical";		public static var FRICTION = 0.0002;		public static var SPRING_CONSTANT = 0.0001;		public static var VELOCITY_EPSILON = 0.001;				private var data;		private var container;		private var scrollAreaBounds;		private var scrollItem;		private var scrollItemBounds;		public var direction:String;		public var padding:int;		private var fit;		private var inputBeginLocation;		private var beginContainerLocation;		private var lastInputTime;		private var inputVelocity;		private var lastContainerLocation;		private var globalScaleFactors;						public function ScrollList(/*direction*/) {			// constructor code			super();			return;			this.setup();			this.addListeners();						this.inputVelocity = new Point(0,0);		}				private function setup(){			// The Scroll Area			var scrollArea = this.getChildByName("scrollArea");			if(!scrollArea){				trace("ScrollList Missing a child named: 'scrollArea'");			}			// Find the bounds and index of the scrollArea			this.scrollAreaBounds = scrollArea.getBounds(this);			var index = this.getChildIndex(scrollArea);						// Create an empty container to replace it			this.container = new Sprite();			this.container.x = this.scrollAreaBounds.x;			this.container.y = this.scrollAreaBounds.y;						// Replace the scrollArea with the empty container			this.addChildAt( this.container, index );			this.removeChild( scrollArea );						// The ScrollItem			this.scrollItem = this.getChildByName("scrollItem");			if(!this.scrollItem){				trace("ScrollList Missing a child named: 'scrollItem'");			}			// Remove the sample scrollItem			this.removeChild( this.scrollItem );			this.scrollItemBounds = this.scrollItem.getBounds(this.scrollItem);						// Fit			this.fit = new Point(				Math.floor(this.scrollAreaBounds.width / this.scrollAreaBounds.width),				Math.floor(this.scrollAreaBounds.height / this.scrollItemBounds.height)			);						// Padding			if( this.direction == ScrollList.HORIZONTAL ){				this.padding = (this.scrollAreaBounds.height - this.fit.y*this.scrollItemBounds.height)/(this.fit.y + 1);			}else{				this.padding = (this.scrollAreaBounds.width - this.fit.x*this.scrollItemBounds.width)/(this.fit.x + 1);			}						this.setData( [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] );		}				private function onInputEnd(event){						this.stage.removeEventListener( MouseEvent.MOUSE_MOVE, this.onInputMove );			this.stage.removeEventListener( TouchEvent.TOUCH_MOVE, this.onInputMove );			this.stage.removeEventListener( MouseEvent.MOUSE_UP, this.onInputEnd );			this.stage.removeEventListener( TouchEvent.TOUCH_END, this.onInputEnd );						this.startGlide();		}				private function startGlide(){			this.lastInputTime = (new Date()).getTime();			this.addEventListener( Event.ENTER_FRAME, this.onGlideEnterFrame );		}				private function endGlide(){			this.removeEventListener( Event.ENTER_FRAME, this.onGlideEnterFrame );		}				private function rightEnd(){			if( this.direction === HORIZONTAL ){				var numHorizontalElements = Math.ceil(this.data.length / this.fit.y);				return this.container.x + numHorizontalElements*this.scrollItemBounds.width + this.padding*(numHorizontalElements-1);			}else if( this.direction === VERTICAL ){				var numVerticalElements = Math.ceil(this.data.length / this.fit.x);				return this.container.y + numVerticalElements*this.scrollItemBounds.height + this.padding*(numVerticalElements-1);			}		}				private function leftEnd(){			if( this.direction === HORIZONTAL ){				return this.container.x;			}else if( this.direction === VERTICAL ){				return this.container.y;			}		}				private function forceOfFriction(){			var speed;			if( this.direction === HORIZONTAL ){				speed = this.inputVelocity.x;			}else if( this.direction === VERTICAL ){				speed = this.inputVelocity.y;			}						if( speed > 0 ){				return -ScrollList.FRICTION*Math.min(1, 100*speed);			}else if( speed < 0 ){				return -ScrollList.FRICTION*Math.max(-1, 100*speed);			}			return 0;		}				private function startBounceBack(){			this.lastInputTime = (new Date()).getTime();			this.addEventListener( Event.ENTER_FRAME, this.onBounceBackEnterFrame );		}				private function endBounceBack(){			this.removeEventListener( Event.ENTER_FRAME, this.onBounceBackEnterFrame );		}				private function onBounceBackEnterFrame(event){			var currentTime = (new Date()).getTime();			var deltaTime = currentTime - this.lastInputTime;			this.lastInputTime = currentTime;			var distancePastTheRightEnd;			var distancePastTheLeftEnd;			if( this.direction === HORIZONTAL ){				distancePastTheRightEnd = this.scrollAreaBounds.x + this.scrollAreaBounds.width - this.rightEnd();				distancePastTheLeftEnd = this.leftEnd() - this.scrollAreaBounds.x;			}else if( this.direction === VERTICAL ){				distancePastTheRightEnd = this.scrollAreaBounds.y + this.scrollAreaBounds.height - this.rightEnd();				distancePastTheLeftEnd = this.leftEnd() - this.scrollAreaBounds.y;			}						var timeToBounceBack;			var timeRemaining;			var distanceRemaining;			if( distancePastTheRightEnd > 0 ){				timeToBounceBack = Math.sqrt(distancePastTheRightEnd)*50;				if( timeToBounceBack < deltaTime ){					if( this.direction === HORIZONTAL ){						this.container.x += distancePastTheRightEnd;					}else if( this.direction === VERTICAL ){						this.container.y += distancePastTheRightEnd;					}					this.endBounceBack();					return;				}				timeRemaining = timeToBounceBack - deltaTime;				distanceRemaining = (timeRemaining/50)*(timeRemaining/50);				if( this.direction === HORIZONTAL ){					this.container.x = this.container.x + distancePastTheRightEnd - distanceRemaining;				}else if( this.direction === VERTICAL ){					this.container.y = this.container.y + distancePastTheRightEnd - distanceRemaining;				}			}else if( distancePastTheLeftEnd > 0 ){				timeToBounceBack = Math.sqrt( distancePastTheLeftEnd )*50;				if( timeToBounceBack < deltaTime ){					if( this.direction === HORIZONTAL ){						this.container.x -= distancePastTheLeftEnd;					}else if( this.direction === VERTICAL ){						this.container.y -= distancePastTheLeftEnd;					}					this.endBounceBack();					return;				}				timeRemaining = timeToBounceBack - deltaTime;				distanceRemaining = (timeRemaining/50)*(timeRemaining/50);				if( this.direction === HORIZONTAL ){					this.container.x = this.container.x - distancePastTheLeftEnd + distanceRemaining;				}else if( this.direction === VERTICAL ){					this.container.y = this.container.y - distancePastTheLeftEnd + distanceRemaining;				}			}else{				this.endBounceBack();			}		}				private function onGlideEnterFrame(event){			var currentTime = (new Date()).getTime();			var deltaTime = currentTime - this.lastInputTime;			this.lastInputTime = currentTime;			var distancePastTheRightEnd;			var distancePastTheLeftEnd;			if( this.direction === HORIZONTAL ){				distancePastTheRightEnd = this.scrollAreaBounds.x + this.scrollAreaBounds.width - this.rightEnd();				distancePastTheLeftEnd = this.leftEnd() - this.scrollAreaBounds.x;			}else if( this.direction === VERTICAL ){				distancePastTheRightEnd = this.scrollAreaBounds.y + this.scrollAreaBounds.height - this.rightEnd();				distancePastTheLeftEnd = this.leftEnd() - this.scrollAreaBounds.y;			}			var friction = this.forceOfFriction();			var springForce = 0;			var netForce = 0;						if( distancePastTheRightEnd > 0 ){				springForce = ScrollList.SPRING_CONSTANT*( distancePastTheRightEnd );				netForce = friction + springForce;				var newValue;				if( this.direction === HORIZONTAL ){					this.inputVelocity.x += netForce*deltaTime;					newValue = this.inputVelocity.x;				}else if( this.direction === VERTICAL ){					this.inputVelocity.y += netForce*deltaTime;					newValue = this.inputVelocity.y;				}				if( newValue > 0 ){					this.endGlide();					this.startBounceBack();					return;				}			}else if( distancePastTheLeftEnd > 0 ){				springForce = -ScrollList.SPRING_CONSTANT*( distancePastTheLeftEnd );				netForce = friction + springForce;				var newValue;				if( this.direction === HORIZONTAL ){					this.inputVelocity.x += netForce*deltaTime;					newValue = this.inputVelocity.x;				}else if( this.direction === VERTICAL ){					this.inputVelocity.y += netForce*deltaTime;					newValue = this.inputVelocity.y				}								if( newValue < 0 ){					this.endGlide();					this.startBounceBack();					return;				}			}else{				netForce = friction;				var newValue;				if( this.direction === HORIZONTAL ){					this.inputVelocity.x += netForce*deltaTime;					newValue = this.inputVelocity.x;				}else if( this.direction === VERTICAL ){					this.inputVelocity.y += netForce*deltaTime;					newValue = this.inputVelocity.y;				}								if( Math.abs(newValue) < ScrollList.VELOCITY_EPSILON ){					this.endGlide();					return;				}			}						if( this.direction === HORIZONTAL ){				this.container.x += this.inputVelocity.x*deltaTime;			}else if( this.direction === VERTICAL ){				this.container.y += this.inputVelocity.y*deltaTime;			}		}				private function onInputMove(event){			var currentLocation = this.globalToLocal(new Point(event.stageX, event.stageY));			var deltaFromStart = currentLocation.subtract(this.inputBeginLocation);			var newContainerLocation = this.beginContainerLocation.add( deltaFromStart );			var delta = newContainerLocation.subtract( this.lastContainerLocation );			this.lastContainerLocation = newContainerLocation;			var currentTime = (new Date()).getTime();			var deltaTime = currentTime - this.lastInputTime;			if( deltaTime < 15 ){				deltaTime = 15;			}			this.lastInputTime = currentTime;			this.inputVelocity.x = delta.x/deltaTime;			this.inputVelocity.y = delta.y/deltaTime;									if( this.direction == ScrollList.HORIZONTAL ){				this.container.x = newContainerLocation.x;			}else if( this.direction == ScrollList.VERTICAL ){				this.container.y = newContainerLocation.y;			}		}				private function onInputBegin(event){			this.endGlide();			this.endBounceBack();						this.inputBeginLocation = this.globalToLocal(new Point(event.stageX, event.stageY));			this.beginContainerLocation = new Point(this.container.x, this.container.y);			this.lastContainerLocation = this.beginContainerLocation.clone();			this.lastInputTime = (new Date()).getTime();			this.inputVelocity.x = 0;			this.inputVelocity.y = 0;						this.stage.addEventListener( MouseEvent.MOUSE_MOVE, this.onInputMove );			this.stage.addEventListener( TouchEvent.TOUCH_MOVE, this.onInputMove );			this.stage.addEventListener( MouseEvent.MOUSE_UP, this.onInputEnd );			this.stage.addEventListener( TouchEvent.TOUCH_END, this.onInputEnd );		}				private function addListeners(){			this.container.addEventListener( MouseEvent.MOUSE_DOWN, this.onInputBegin );			this.container.addEventListener( TouchEvent.TOUCH_BEGIN, this.onInputBegin );		}				public function setData(data){			this.data = data;			this.removeAllScrollItems();																																																											this.addAllScrollItems();		}				private function removeAllScrollItems(){			for( var i = this.container.numChildren - 1; i >= 0; i-- ){				this.container.removeChildAt(i);			}		}				private function addAllScrollItems(){			var klass = this.scrollItem.constructor;			for( var i = 0; i < this.data.length; i++ ){				var datum = this.data[i];				var tempScrollItem = new klass();								if( this.direction === ScrollList.HORIZONTAL ){					tempScrollItem.x = (this.scrollItemBounds.width + this.padding)*( Math.floor(i/this.fit.y) );					tempScrollItem.y = this.padding + (this.scrollItemBounds.height + this.padding)*( i%this.fit.y );									}else if( this.direction === ScrollList.VERTICAL ){					tempScrollItem.x = this.padding + (this.scrollItemBounds.width + this.padding)*( i%this.fit.x );					tempScrollItem.y = (this.scrollItemBounds.height + this.padding)*( Math.floor(i/this.fit.x) );				}				this.container.addChild( tempScrollItem );			}		}	}	}